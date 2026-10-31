import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
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

  async execute(partidaId: number, dto: RegistrarRondaDto): Promise<Ronda> {
    const partida = await this.partidaRepository.findById(partidaId);
    if (!partida) {
      throw new NotFoundException(`La partida con ID ${partidaId} no existe`);
    }

    const ronda = await this.partidaRepository.registrarRonda({
      partidaId,
      numeroRonda: dto.numeroRonda,
      bandoGanadorId: dto.bandoGanadorId,
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
