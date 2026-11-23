import { Injectable, Inject } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';

@Injectable()
export class ObtenerMiEquipoUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
  ) {}

  async execute(jugadorId: number): Promise<Equipo | null> {
    if (!jugadorId) return null;
    return this.equipoRepository.obtenerMiEquipo(jugadorId);
  }
}
