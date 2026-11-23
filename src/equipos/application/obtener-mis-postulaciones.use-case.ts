import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { PostulacionEquipo } from '../domain/postulacion.entity';

@Injectable()
export class ObtenerMisPostulacionesUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
  ) {}

  async execute(jugadorId: number): Promise<PostulacionEquipo[]> {
    if (!jugadorId) {
      throw new ForbiddenException('Operación no permitida: Operador no identificado.');
    }
    return this.equipoRepository.listarMisPostulaciones(jugadorId);
  }
}
