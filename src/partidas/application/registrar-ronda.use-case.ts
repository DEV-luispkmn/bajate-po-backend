import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PARTIDA_REPOSITORY } from '../domain/partida.repository.interface';
import type { IPartidaRepository } from '../domain/partida.repository.interface';
import { PARTIDA_NOTIFICATION_SERVICE } from './partida-notification.interface';
import type { IPartidaNotificationService } from './partida-notification.interface';
import { RegistrarRondaDto } from './registrar-ronda.dto';
import { Ronda } from '../domain/partida.entity';

@Injectable()
export class RegistrarRondaUseCase {
  constructor(
    @Inject(PARTIDA_REPOSITORY)
    private readonly partidaRepository: IPartidaRepository,
    @Optional()
    @Inject(PARTIDA_NOTIFICATION_SERVICE)
    private readonly notificationService?: IPartidaNotificationService,
  ) {}

  async execute(partidaId: number, dto: RegistrarRondaDto, jugadorId?: number): Promise<Ronda> {
    const detalle = await this.partidaRepository.findByIdConBandos(partidaId);
    if (!detalle) {
      throw new NotFoundException(`La partida con ID ${partidaId} no existe`);
    }

    if (jugadorId !== undefined && detalle.organizadorId !== jugadorId) {
      throw new ForbiddenException('Solo el organizador de la partida puede registrar rondas o puntos');
    }

    // Validación táctica: No se pueden asignar puntajes a no ser de que haya mínimo 1 jugador por bando
    const jugadoresPartida = await this.partidaRepository.obtenerJugadoresDePartida(partidaId);
    if (detalle.bandos && detalle.bandos.length >= 2) {
      const bandoSinJugador = detalle.bandos.find((bando) => {
        const count = jugadoresPartida.filter((j) => j.bandoId === bando.id).length;
        return count < 1;
      });
      if (bandoSinJugador) {
        throw new BadRequestException(
          `No se pueden asignar puntajes a la partida: el bando "${bandoSinJugador.nombre}" no tiene jugadores. Debe haber al menos 1 combatiente por bando.`,
        );
      }
    }

    // Si la partida estaba PENDIENTE, al registrar la primera ronda pasa a estar EN_CURSO
    if (detalle.partida.estado === 'PENDIENTE') {
      await this.partidaRepository.actualizarEstado(partidaId, 'EN_CURSO');
      if (this.notificationService) {
        this.notificationService.notificarEstadoCambiado(partidaId, 'EN_CURSO');
      }
    }

    // Resolver bandoGanadorId de forma resiliente
    let bandoGanadorId = dto.bandoGanadorId;
    if (bandoGanadorId) {
      const existeExacto = detalle.bandos.some((b) => b.id === bandoGanadorId);
      if (!existeExacto) {
        // Si enviaron 1 o 2 por índice, mapear al bando real correspondiente
        if (bandoGanadorId === 1 && detalle.bandos[0]) {
          bandoGanadorId = detalle.bandos[0].id;
        } else if (bandoGanadorId === 2 && detalle.bandos[1]) {
          bandoGanadorId = detalle.bandos[1].id;
        } else {
          bandoGanadorId = undefined;
        }
      }
    }

    const ronda = await this.partidaRepository.registrarRonda({
      partidaId,
      numeroRonda: dto.numeroRonda,
      bandoGanadorId,
      fechaRegistro: dto.fechaRegistro ? new Date(dto.fechaRegistro) : new Date(),
    });

    if (this.notificationService) {
      const todasLasRondas = await this.partidaRepository.obtenerRondasDePartida(partidaId);
      const marcador: Record<number, number> = {};
      for (const r of todasLasRondas) {
        if (r.bandoGanadorId) {
          marcador[r.bandoGanadorId] = (marcador[r.bandoGanadorId] || 0) + 1;
        }
      }
      this.notificationService.notificarRondaRegistrada(partidaId, ronda, marcador);
    }

    return ronda;
  }
}
