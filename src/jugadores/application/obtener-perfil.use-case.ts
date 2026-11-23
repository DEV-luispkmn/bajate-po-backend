import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  JUGADOR_REPOSITORY,
  PerfilCompleto,
} from '../domain/jugador.repository.interface';
import type { IJugadorRepository } from '../domain/jugador.repository.interface';

@Injectable()
export class ObtenerPerfilUseCase {
  constructor(
    @Inject(JUGADOR_REPOSITORY)
    private readonly jugadorRepository: IJugadorRepository,
  ) {}

  async execute(jugadorId: number): Promise<PerfilCompleto> {
    const perfil = await this.jugadorRepository.obtenerPerfilCompleto(jugadorId);
    if (!perfil) {
      throw new NotFoundException('Jugador no encontrado');
    }
    return perfil;
  }
}
