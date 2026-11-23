import { Injectable, Inject, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';

@Injectable()
export class AsignarTLUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
  ) {}

  async execute(jugadorId: number, nuevoTlId: number): Promise<Equipo> {
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
        'Solo el Team Leader (TL) actual o el fundador pueden asignar la comandancia de la escuadra.',
      );
    }

    const esMiembro = miEquipo.miembros?.some((m) => m.id === nuevoTlId);
    if (!esMiembro) {
      throw new BadRequestException('El operador designado debe ser miembro activo del equipo.');
    }

    return this.equipoRepository.asignarTL(miEquipo.id, nuevoTlId);
  }
}
