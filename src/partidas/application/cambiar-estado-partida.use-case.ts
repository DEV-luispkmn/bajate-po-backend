import { Injectable, Inject, NotFoundException, ForbiddenException, Optional } from '@nestjs/common';
import { PARTIDA_REPOSITORY } from '../domain/partida.repository.interface';
import type { IPartidaRepository } from '../domain/partida.repository.interface';
import { PARTIDA_NOTIFICATION_SERVICE } from './partida-notification.interface';
import type { IPartidaNotificationService } from './partida-notification.interface';
import { CambiarEstadoPartidaDto } from './cambiar-estado-partida.dto';
import { Partida, EstadoPartida } from '../domain/partida.entity';

@Injectable()
export class CambiarEstadoPartidaUseCase {
  constructor(
    @Inject(PARTIDA_REPOSITORY)
    private readonly partidaRepository: IPartidaRepository,
    @Optional()
    @Inject(PARTIDA_NOTIFICATION_SERVICE)
    private readonly notificationService?: IPartidaNotificationService,
  ) {}

  async execute(
    partidaId: number,
    dto: CambiarEstadoPartidaDto,
    jugadorId?: number,
  ): Promise<Partida> {
    const detalle = await this.partidaRepository.findByIdConBandos(partidaId);
    if (!detalle) {
      throw new NotFoundException(`La partida con ID ${partidaId} no existe`);
    }

    if (jugadorId !== undefined && detalle.organizadorId !== jugadorId) {
      throw new ForbiddenException('Solo el organizador del evento puede cambiar el estado o finalizar la partida');
    }

    const actualizada = await this.partidaRepository.actualizarEstado(
      partidaId,
      dto.estado as EstadoPartida,
    );

    if (this.notificationService) {
      this.notificationService.notificarEstadoCambiado(partidaId, dto.estado as EstadoPartida);
    }

    return actualizada;
  }
}
