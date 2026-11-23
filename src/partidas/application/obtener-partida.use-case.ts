import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PARTIDA_REPOSITORY } from '../domain/partida.repository.interface';
import type { IPartidaRepository } from '../domain/partida.repository.interface';
import { Partida } from '../domain/partida.entity';

export interface DetallePartidaCompleto {
  partida: Partida;
  bandos: { id: number; nombre: string; colorHex?: string }[];
  organizadorId: number;
  tituloEvento: string;
}

@Injectable()
export class ObtenerPartidaUseCase {
  constructor(
    @Inject(PARTIDA_REPOSITORY)
    private readonly partidaRepository: IPartidaRepository,
  ) {}

  async execute(partidaId: number): Promise<DetallePartidaCompleto> {
    const detalle = await this.partidaRepository.findByIdConBandos(partidaId);
    if (!detalle) {
      throw new NotFoundException(`La partida con ID ${partidaId} no existe`);
    }
    return detalle;
  }
}
