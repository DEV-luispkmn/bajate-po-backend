import { Injectable, Inject, Optional, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { PostulacionEquipo } from '../domain/postulacion.entity';
import { NotificacionesService } from '../../notificaciones/notificaciones.service';

@Injectable()
export class ResponderPostulacionUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
    @Optional()
    private readonly notificacionesService?: NotificacionesService,
  ) {}

  async execute(
    jugadorId: number,
    postulacionId: number,
    decision: 'ACEPTAR' | 'RECHAZAR',
    motivo?: string,
  ): Promise<PostulacionEquipo> {
    if (!jugadorId) {
      throw new ForbiddenException('Operación no permitida: Operador no identificado.');
    }

    const miEquipo = await this.equipoRepository.obtenerMiEquipo(jugadorId);
    if (!miEquipo) {
      throw new NotFoundException('No perteneces a ninguna escuadra.');
    }

    const esAutorizado =
      miEquipo.tlId === jugadorId ||
      miEquipo.fundadorId === jugadorId ||
      miEquipo.capitanId === jugadorId;

    if (!esAutorizado) {
      throw new ForbiddenException(
        'Solo el Team Leader (TL) o el fundador tienen atribuciones para responder postulaciones.',
      );
    }

    const postulacion = await this.equipoRepository.buscarPostulacionPorId(postulacionId);
    if (!postulacion) {
      throw new NotFoundException('La postulación no existe.');
    }

    if (postulacion.equipoId !== miEquipo.id) {
      throw new ForbiddenException('Esta postulación no pertenece a tu escuadra táctica.');
    }

    if (postulacion.estado !== 'PENDIENTE') {
      throw new BadRequestException(
        `Esta postulación ya fue procesada anteriormente con estado: ${postulacion.estado}.`,
      );
    }

    if (decision === 'ACEPTAR') {
      // Si el postulante ya está en otro equipo, salir primero
      const equipoDelPostulante = await this.equipoRepository.obtenerMiEquipo(postulacion.jugadorId);
      if (equipoDelPostulante) {
        await this.equipoRepository.salirJugador(postulacion.jugadorId);
      }

      // Unir al jugador a la escuadra
      await this.equipoRepository.unirJugador(miEquipo.id, postulacion.jugadorId);

      const actualizada = await this.equipoRepository.actualizarEstadoPostulacion(postulacionId, 'ACEPTADA');

      if (this.notificacionesService) {
        await this.notificacionesService
          .crear({
            jugadorId: postulacion.jugadorId,
            titulo: '🎖️ ¡Postulación Aprobada!',
            mensaje: `¡Felicitaciones! Has sido aceptado oficialmente en "${miEquipo.nombre}". ¡Bienvenido a las filas!`,
            tipo: 'POSTULACION_APROBADA',
            link: JSON.stringify({
              tipo: 'POSTULACION_APROBADA',
              equipoId: miEquipo.id,
              equipoNombre: miEquipo.nombre,
              screen: 'Equipos',
              params: { tab: 'MI_EQUIPO' },
            }),
          })
          .catch(() => null);
      }

      return actualizada;
    } else if (decision === 'RECHAZAR') {
      const actualizada = motivo?.trim()
        ? await this.equipoRepository.actualizarEstadoPostulacion(postulacionId, 'RECHAZADA', motivo.trim())
        : await this.equipoRepository.actualizarEstadoPostulacion(postulacionId, 'RECHAZADA');

      if (this.notificacionesService) {
        const mensajeNotif = motivo?.trim()
          ? `El Team Leader de "${miEquipo.nombre}" ha declinado tu solicitud de ingreso. Motivo: "${motivo.trim()}".`
          : `El Team Leader de "${miEquipo.nombre}" ha declinado tu solicitud de ingreso.`;

        await this.notificacionesService
          .crear({
            jugadorId: postulacion.jugadorId,
            titulo: 'Postulación Declinada',
            mensaje: mensajeNotif,
            tipo: 'POSTULACION_RECHAZADA',
            link: JSON.stringify({
              tipo: 'POSTULACION_RECHAZADA',
              equipoId: miEquipo.id,
              equipoNombre: miEquipo.nombre,
              motivo: motivo?.trim() || null,
            }),
          })
          .catch(() => null);
      }

      return actualizada;
    } else {
      throw new BadRequestException('Decisión no válida. Debe ser ACEPTAR o RECHAZAR.');
    }
  }
}
