import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';

@Injectable()
export class ObtenerEquipoUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
  ) {}

  async execute(id: number): Promise<Equipo> {
    const equipo = await this.equipoRepository.buscarPorId(id);
    if (!equipo) {
      throw new NotFoundException(`Equipo #${id} no encontrado`);
    }
    return equipo;
  }
}
