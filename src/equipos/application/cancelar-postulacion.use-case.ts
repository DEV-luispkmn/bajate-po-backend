import { Injectable, Inject, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { PostulacionEquipo } from '../domain/postulacion.entity';

@Injectable()
export class CancelarPostulacionUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
  ) {}

  async execute(jugadorId: number, postulacionId: number): Promise<PostulacionEquipo> {
    if (!jugadorId) {
      throw new ForbiddenException('Operación no permitida: Operador no identificado.');
    }

    const postulacion = await this.equipoRepository.buscarPostulacionPorId(postulacionId);
    if (!postulacion) {
      throw new NotFoundException('La postulación no existe.');
    }

    if (postulacion.jugadorId !== jugadorId) {
      throw new ForbiddenException('Solo puedes cancelar tus propias postulaciones.');
    }

    if (postulacion.estado !== 'PENDIENTE') {
      throw new BadRequestException('Solo se pueden cancelar postulaciones que se encuentren pendientes.');
    }

    return this.equipoRepository.actualizarEstadoPostulacion(postulacionId, 'CANCELADA');
  }
}
