import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { PostulacionEquipo, EstadoPostulacion } from '../domain/postulacion.entity';

@Injectable()
export class ListarPostulacionesEquipoUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
  ) {}

  async execute(jugadorId: number, estado?: EstadoPostulacion): Promise<PostulacionEquipo[]> {
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
        'Solo el Team Leader (TL) o el fundador tienen atribuciones para revisar las postulaciones.',
      );
    }

    return this.equipoRepository.listarPostulaciones(miEquipo.id, estado);
  }
}
