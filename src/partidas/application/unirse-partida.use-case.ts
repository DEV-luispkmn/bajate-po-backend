import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PARTIDA_REPOSITORY } from '../domain/partida.repository.interface';
import type { IPartidaRepository } from '../domain/partida.repository.interface';
import { EVENTO_REPOSITORY } from '../../eventos/domain/evento.repository.interface';
import type { IEventoRepository } from '../../eventos/domain/evento.repository.interface';
import { PartidasGateway } from '../infrastructure/partidas.gateway';
import { UnirsePartidaDto } from './unirse-partida.dto';

@Injectable()
export class UnirsePartidaUseCase {
  constructor(
    @Inject(PARTIDA_REPOSITORY)
    private readonly partidaRepository: IPartidaRepository,
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
    private readonly gateway: PartidasGateway,
  ) {}

  async execute(partidaId: number, jugadorId: number, dto: UnirsePartidaDto) {
    const partida = await this.partidaRepository.findById(partidaId);
    if (!partida) {
      throw new NotFoundException(`La partida con ID ${partidaId} no existe`);
    }

    if (partida.estado === 'FINALIZADA') {
      throw new BadRequestException('No puedes unirte a una partida que ya ha concluido');
    }

    const evento = await this.eventoRepository.findById(partida.eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento asociado no existe`);
    }

    const bandos = evento.bandos || [];
    if (bandos.length < 2) {
      throw new BadRequestException('El evento no cuenta con bandos suficientes para el combate');
    }

    const rolFinal = dto.rol?.trim() || 'ASALTO';

    // Jugadores actuales de la partida
    const jugadoresActuales = await this.partidaRepository.obtenerJugadoresDePartida(partidaId);

    // Determinar bando
    let bandoIdFinal: number;

    if (dto.bandoId) {
      const bandoExiste = bandos.some((b) => b.id === dto.bandoId);
      if (!bandoExiste) {
        throw new BadRequestException('El bando seleccionado no pertenece a este evento');
      }
      bandoIdFinal = dto.bandoId;
    } else {
      // Balance automático: asignar al bando con menor cantidad de jugadores en esta partida
      const conteo = bandos.map((b) => ({
        bandoId: b.id,
        cantidad: jugadoresActuales.filter((j) => j.bandoId === b.id).length,
      }));
      conteo.sort((a, b) => a.cantidad - b.cantidad);
      bandoIdFinal = conteo[0].bandoId;
    }

    // Inscribir o actualizar en la partida (upsert)
    await this.partidaRepository.asignarJugadorAPartida(
      partidaId,
      jugadorId,
      bandoIdFinal,
      rolFinal,
    );

    // Asegurar inscripción / actualización en el evento general
    await this.eventoRepository.unirJugadorABando(
      evento.id,
      jugadorId,
      bandoIdFinal,
      rolFinal,
    );

    // Obtener lista completa actualizada de jugadores de la partida
    const jugadoresActualizados = await this.partidaRepository.obtenerJugadoresDePartida(partidaId);

    // Emitir WebSocket en tiempo real
    try {
      this.gateway.server?.to(`partida_${partidaId}`).emit('partida_jugadores_actualizados', {
        partidaId,
        jugadores: jugadoresActualizados,
      });
    } catch {}

    const bandoAsignado = bandos.find((b) => b.id === bandoIdFinal);

    return {
      mensaje: `Te has unido exitosamente al combate en ${bandoAsignado?.nombre || 'tu escuadra'}.`,
      bandoId: bandoIdFinal,
      bandoNombre: bandoAsignado?.nombre,
      rol: rolFinal,
      jugadores: jugadoresActualizados,
    };
  }
}
