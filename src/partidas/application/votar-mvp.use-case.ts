import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PARTIDA_REPOSITORY } from '../domain/partida.repository.interface';
import type { IPartidaRepository } from '../domain/partida.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { PartidasGateway } from '../infrastructure/partidas.gateway';

@Injectable()
export class VotarMvpUseCase {
  constructor(
    @Inject(PARTIDA_REPOSITORY)
    private readonly partidaRepository: IPartidaRepository,
    private readonly prisma: PrismaService,
    private readonly gateway: PartidasGateway,
  ) {}

  async execute(partidaId: number, candidatoId: number, votanteId: number) {
    if (votanteId === candidatoId) {
      throw new BadRequestException('No puedes votar por ti mismo como MVP');
    }

    const partida = await this.partidaRepository.findById(partidaId);
    if (!partida) {
      throw new NotFoundException(`La partida con ID ${partidaId} no existe`);
    }

    if (partida.estado !== 'FINALIZADA') {
      throw new BadRequestException('Solo se puede votar por el MVP cuando la partida ha concluido');
    }

    // Validar límite de 2 días (48 horas) desde que finalizó la partida
    const fechaFin =
      partida.finalizadaAt ||
      (partida.rondas && partida.rondas.length > 0
        ? partida.rondas[partida.rondas.length - 1].fechaRegistro
        : null);

    if (fechaFin) {
      const msTranscurridos = Date.now() - new Date(fechaFin).getTime();
      const dosDiasMs = 2 * 24 * 60 * 60 * 1000;
      if (msTranscurridos > dosDiasMs) {
        throw new BadRequestException(
          'El plazo para premiar al MVP de esta partida ha expirado (límite: 2 días posteriores al término de la partida).',
        );
      }
    }

    // Verificar si el votante ya votó en esta partida
    const yaVoto = await this.partidaRepository.haVotadoMvp(partidaId, votanteId);
    if (yaVoto) {
      throw new BadRequestException('Ya has emitido tu voto para el MVP de esta partida');
    }

    // Obtener combatientes de esta partida
    const jugadoresPartida = await this.partidaRepository.obtenerJugadoresDePartida(partidaId);

    // Identificar bando del votante
    let votanteEnPartida = jugadoresPartida.find((j) => j.jugadorId === votanteId);
    if (!votanteEnPartida) {
      const jb = await this.prisma.jugadorBando.findUnique({
        where: { eventoId_jugadorId: { eventoId: partida.eventoId, jugadorId: votanteId } },
      });
      if (jb && jb.bandoId) {
        votanteEnPartida = {
          jugadorId: votanteId,
          alias: 'Tú',
          bandoId: jb.bandoId,
          rol: jb.rol,
        };
        await this.partidaRepository.asignarJugadorAPartida(partidaId, votanteId, jb.bandoId, jb.rol);
      }
    }

    if (!votanteEnPartida || !votanteEnPartida.bandoId) {
      throw new ForbiddenException('No participaste en esta partida, por lo que no puedes votar por su MVP');
    }

    // Identificar bando del candidato
    let candidatoEnPartida = jugadoresPartida.find((j) => j.jugadorId === candidatoId);
    if (!candidatoEnPartida) {
      const jbCand = await this.prisma.jugadorBando.findUnique({
        where: { eventoId_jugadorId: { eventoId: partida.eventoId, jugadorId: candidatoId } },
      });
      if (jbCand && jbCand.bandoId) {
        candidatoEnPartida = {
          jugadorId: candidatoId,
          alias: 'Compañero',
          bandoId: jbCand.bandoId,
          rol: jbCand.rol,
        };
      }
    }

    if (!candidatoEnPartida || candidatoEnPartida.bandoId !== votanteEnPartida.bandoId) {
      throw new BadRequestException('Solo puedes votar por un combatiente de tu propio bando');
    }

    // Registrar voto
    await this.partidaRepository.registrarVotoMvp(
      partidaId,
      votanteId,
      candidatoId,
      votanteEnPartida.bandoId,
    );

    // Calcular MVPs vigentes
    const mvps = await this.partidaRepository.obtenerMvpsDePartida(partidaId);

    // Sincronizar estado de MVP en JugadorPartida y actualizar fama (+1.0) y mvpsGanados (+1)
    try {
      const currentMvpJugadorIds = new Set(mvps.map((m) => m.jugadorId));

      const jugadoresConMvpPrevio = await this.prisma.jugadorPartida.findMany({
        where: { partidaId, esMvp: true },
      });

      // Si algún jugador ya no es MVP por ser superado en votos, revertir su bono
      for (const jPrev of jugadoresConMvpPrevio) {
        if (!currentMvpJugadorIds.has(jPrev.jugadorId)) {
          await this.prisma.jugadorPartida.update({
            where: { partidaId_jugadorId: { partidaId, jugadorId: jPrev.jugadorId } },
            data: { esMvp: false },
          });
          await this.prisma.jugador.update({
            where: { id: jPrev.jugadorId },
            data: {
              fama: { decrement: 1.0 },
              mvpsGanados: { decrement: 1 },
            },
          });
        }
      }

      // Conceder bono de MVP a los que ahora lideran
      for (const mvp of mvps) {
        const yaEsMvp = jugadoresConMvpPrevio.some((j) => j.jugadorId === mvp.jugadorId);
        if (!yaEsMvp) {
          await this.prisma.jugadorPartida.upsert({
            where: { partidaId_jugadorId: { partidaId, jugadorId: mvp.jugadorId } },
            update: { esMvp: true },
            create: {
              partidaId,
              jugadorId: mvp.jugadorId,
              bandoId: mvp.bandoId,
              rol: 'COMBATIENTE',
              esMvp: true,
            },
          });
          await this.prisma.jugador.update({
            where: { id: mvp.jugadorId },
            data: {
              fama: { increment: 1.0 },
              mvpsGanados: { increment: 1 },
            },
          });
        }
      }
    } catch (err) {
      // Registrar error pero no interrumpir la respuesta del voto
      console.error('Error al actualizar bonos de fama/MVP:', err);
    }

    // Difundir en tiempo real por WebSocket
    try {
      this.gateway.server?.to(`partida_${partidaId}`).emit('mvp_actualizado', {
        partidaId,
        mvps,
      });
    } catch {}

    return {
      mensaje: '¡Voto de MVP registrado con éxito!',
      partidaId,
      candidatoId,
      mvps,
    };
  }
}
