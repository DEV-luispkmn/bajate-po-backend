import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';

@Injectable()
export class CambiarPostulacionesUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
  ) {}

  async execute(jugadorId: number, abiertas: boolean): Promise<Equipo> {
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
        'Solo el Team Leader (TL) oficial o el fundador tienen atribuciones para abrir o cerrar postulaciones.',
      );
    }

    return this.equipoRepository.cambiarEstadoPostulaciones(miEquipo.id, abiertas);
  }
}
