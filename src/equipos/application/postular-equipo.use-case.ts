import { Injectable, Inject, Optional, NotFoundException, BadRequestException } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { PostularEquipoDto } from './postular-equipo.dto';
import { PostulacionEquipo } from '../domain/postulacion.entity';
import { NotificacionesService } from '../../notificaciones/notificaciones.service';

@Injectable()
export class PostularEquipoUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
    @Optional()
    private readonly notificacionesService?: NotificacionesService,
  ) {}

  async execute(
    jugadorId: number,
    equipoId: number,
    dto: PostularEquipoDto,
  ): Promise<PostulacionEquipo> {
    if (!jugadorId) {
      throw new BadRequestException('Operación no permitida: Operador no identificado.');
    }

    const equipo = await this.equipoRepository.buscarPorId(equipoId);
    if (!equipo) {
      throw new NotFoundException('No se encontró el equipo indicado.');
    }

    if (!equipo.activo) {
      throw new BadRequestException('Esta escuadra no se encuentra activa.');
    }

    if (!equipo.postulacionesAbiertas) {
      throw new BadRequestException(
        `Las postulaciones para "${equipo.nombre}" están cerradas por el Team Leader (TL).`,
      );
    }

    const miEquipoActual = await this.equipoRepository.obtenerMiEquipo(jugadorId);
    if (miEquipoActual && miEquipoActual.id === equipo.id) {
      throw new BadRequestException('Ya formas parte de esta escuadra táctica.');
    }

    const postulacionExistente = await this.equipoRepository.obtenerPostulacionActiva(
      jugadorId,
      equipoId,
    );
    if (postulacionExistente) {
      throw new BadRequestException('Ya tienes una postulación pendiente enviada a este equipo.');
    }

    const postulacion = await this.equipoRepository.crearPostulacion(equipoId, jugadorId, {
      contacto: dto.contacto?.trim(),
      mensaje: dto.mensaje?.trim(),
    });

    if (this.notificacionesService) {
      const destinatarioId = equipo.tlId || equipo.fundadorId || equipo.capitanId;
      if (destinatarioId && destinatarioId !== jugadorId) {
        await this.notificacionesService
          .crear({
            jugadorId: destinatarioId,
            titulo: '📬 Nueva Postulación Recibida',
            mensaje: `Has recibido una nueva postulación para unirse a "${equipo.nombre}". Revisa los antecedentes en tu Panel de TL.`,
            tipo: 'NUEVA_POSTULACION',
            link: JSON.stringify({
              tipo: 'NUEVA_POSTULACION',
              equipoId: equipo.id,
              equipoNombre: equipo.nombre,
              screen: 'Equipos',
              params: { tab: 'MI_EQUIPO' },
            }),
          })
          .catch(() => null);
      }
    }

    return postulacion;
  }
}
