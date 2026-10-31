import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import { PARTIDA_REPOSITORY } from '../domain/partida.repository.interface';
import type { IPartidaRepository } from '../domain/partida.repository.interface';
import { PARTIDA_NOTIFICATION_SERVICE } from './partida-notification.interface';
import type { IPartidaNotificationService } from './partida-notification.interface';
import { SincronizarRondasDto } from './sincronizar-rondas.dto';
import { Ronda } from '../domain/partida.entity';

@Injectable()
export class SincronizarRondasUseCase {
  constructor(
    @Inject(PARTIDA_REPOSITORY)
    private readonly partidaRepository: IPartidaRepository,
    @Optional()
    @Inject(PARTIDA_NOTIFICATION_SERVICE)
    private readonly notificationService?: IPartidaNotificationService,
  ) {}

  async execute(partidaId: number, dto: SincronizarRondasDto): Promise<Ronda[]> {
    const partida = await this.partidaRepository.findById(partidaId);
    if (!partida) {
      throw new NotFoundException(`La partida con ID ${partidaId} no existe`);
    }

    const rondasData = dto.rondas.map((r) => ({
      partidaId,
      numeroRonda: r.numeroRonda,
      bandoGanadorId: r.bandoGanadorId,
      fechaRegistro: r.fechaRegistro ? new Date(r.fechaRegistro) : new Date(),
    }));

    const resultado = await this.partidaRepository.sincronizarRondas(rondasData);

    if (this.notificationService) {
      const todasLasRondas = await this.partidaRepository.obtenerRondasDePartida(partidaId);
      const marcador: Record<number, number> = {};
      for (const r of todasLasRondas) {
        if (r.bandoGanadorId) {
          marcador[r.bandoGanadorId] = (marcador[r.bandoGanadorId] || 0) + 1;
        }
      }
      this.notificationService.notificarRondasSincronizadas(partidaId, resultado, marcador);
    }

    return resultado;
  }
}
