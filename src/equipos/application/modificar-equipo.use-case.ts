import { Injectable, Inject, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { ModificarEquipoDto } from './modificar-equipo.dto';
import { Equipo } from '../domain/equipo.entity';

@Injectable()
export class ModificarEquipoUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
  ) {}

  async execute(jugadorId: number, dto: ModificarEquipoDto): Promise<Equipo> {
    if (!jugadorId) {
      throw new ForbiddenException('Operación no permitida: Operador no identificado.');
    }

    const miEquipo = await this.equipoRepository.obtenerMiEquipo(jugadorId);
    if (!miEquipo) {
      throw new NotFoundException('No perteneces a ningún equipo.');
    }

    const esAutorizado =
      miEquipo.tlId === jugadorId ||
      miEquipo.fundadorId === jugadorId ||
      miEquipo.capitanId === jugadorId;

    if (!esAutorizado) {
      throw new ForbiddenException(
        'Solo el Team Leader (TL) oficial o el fundador tienen atribuciones para modificar los datos del equipo.',
      );
    }

    if (dto.nombre !== undefined && dto.nombre.trim() === '') {
      throw new BadRequestException('El nombre del equipo no puede estar vacío.');
    }

    return this.equipoRepository.modificar(miEquipo.id, {
      ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
      ...(dto.lema !== undefined && { lema: dto.lema.trim() }),
      ...(dto.descripcion !== undefined && { descripcion: dto.descripcion.trim() }),
      ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl.trim() }),
      ...(dto.region !== undefined && { region: dto.region.trim() }),
      ...(dto.ciudad !== undefined && { ciudad: dto.ciudad.trim() }),
    });
  }
}
