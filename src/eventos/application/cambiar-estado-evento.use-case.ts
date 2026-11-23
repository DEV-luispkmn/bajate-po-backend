import { Injectable, Inject, Optional, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import { CambiarEstadoEventoDto } from './cambiar-estado-evento.dto';
import { Evento, EstadoEvento } from '../domain/evento.entity';
import { NotificacionesService } from '../../notificaciones/notificaciones.service';

@Injectable()
export class CambiarEstadoEventoUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
    @Optional()
    private readonly notificacionesService?: NotificacionesService,
  ) {}

  async execute(
    eventoId: number,
    dto: CambiarEstadoEventoDto,
    jugadorId: number,
  ): Promise<Evento> {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento con ID ${eventoId} no existe`);
    }

    if (evento.organizadorId !== jugadorId) {
      throw new ForbiddenException('Solo el organizador del evento puede cambiar su estado');
    }

    if (dto.estado === 'EN_CURSO') {
      const jugadoresInscritos = evento.jugadoresInscritos || [];
      if (jugadoresInscritos.length < 2) {
        throw new BadRequestException(
          'No se puede iniciar el evento: se requieren al menos 2 jugadores inscritos.',
        );
      }

      if (evento.tipo === 'VERSUS' || evento.tipo === 'EVENTO_MASIVO') {
        const bandos = evento.bandos || [];
        if (bandos.length >= 2) {
          const hayBandoVacio = bandos.some((bando) => {
            const count = jugadoresInscritos.filter((j) => j.bandoId === bando.id).length;
            return count < 1;
          });
          if (hayBandoVacio) {
            throw new BadRequestException(
              'No se puede iniciar el evento: en un Versus o Evento Masivo debe haber al menos 1 jugador inscrito en cada bando.',
            );
          }
        }
      }
    }

    const eventoActualizado = await this.eventoRepository.actualizarEstado(
      eventoId,
      dto.estado as EstadoEvento,
      dto.motivoCancelacion,
    );

    if (dto.estado === 'EN_CURSO' && this.notificacionesService) {
      const inscritos = evento.jugadoresInscritos || [];
      for (const j of inscritos) {
        if (j.jugadorId !== jugadorId) {
          await this.notificacionesService
            .crear({
              jugadorId: j.jugadorId,
              titulo: '🎯 ¡Operación Iniciada!',
              mensaje: `El combate en "${evento.titulo}" acaba de dar inicio. ¡Únete a la partida!`,
              tipo: 'EVENTO_INICIADO',
              link: JSON.stringify({
                tipo: 'EVENTO_INICIADO',
                eventoId: evento.id,
                titulo: evento.titulo,
                screen: 'EventoDetalle',
                params: { eventoId: evento.id },
              }),
            })
            .catch(() => null);
        }
      }
    }

    if (dto.estado === 'FINALIZADO' && this.notificacionesService) {
      const inscritos = evento.jugadoresInscritos || [];
      for (const j of inscritos) {
        if (j.jugadorId !== jugadorId) {
          await this.notificacionesService
            .crear({
              jugadorId: j.jugadorId,
              titulo: '🏁 Partida Finalizada',
              mensaje: `La operación "${evento.titulo}" ha finalizado oficialmente. ¡Gracias por combatir!`,
              tipo: 'SISTEMA',
              link: JSON.stringify({
                tipo: 'EVENTO_FINALIZADO',
                eventoId: evento.id,
                titulo: evento.titulo,
                screen: 'EventoDetalle',
                params: { eventoId: evento.id },
              }),
            })
            .catch(() => null);
        }
      }
    }

    if (dto.estado === 'CANCELADO' && this.notificacionesService) {
      const inscritos = evento.jugadoresInscritos || [];
      const motivo = dto.motivoCancelacion?.trim();
      for (const j of inscritos) {
        if (j.jugadorId !== jugadorId) {
          await this.notificacionesService
            .crear({
              jugadorId: j.jugadorId,
              titulo: '❌ Partida Cancelada',
              mensaje: motivo
                ? `La partida "${evento.titulo}" fue cancelada. Motivo: ${motivo}`
                : `La partida "${evento.titulo}" fue cancelada por el organizador.`,
              tipo: 'EVENTO_CANCELADO',
              link: JSON.stringify({
                tipo: 'EVENTO_CANCELADO',
                eventoId: evento.id,
                titulo: evento.titulo,
                motivo: motivo || null,
                screen: 'EventoDetalle',
                params: { eventoId: evento.id },
              }),
            })
            .catch(() => null);
        }
      }
    }

    return eventoActualizado;
  }
}
