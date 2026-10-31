import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PARTIDA_REPOSITORY } from '../domain/partida.repository.interface';
import type { IPartidaRepository } from '../domain/partida.repository.interface';
import { EVENTO_REPOSITORY } from '../../eventos/domain/evento.repository.interface';
import type { IEventoRepository } from '../../eventos/domain/evento.repository.interface';
import { Partida } from '../domain/partida.entity';

@Injectable()
export class ListarPartidasEventoUseCase {
  constructor(
    @Inject(PARTIDA_REPOSITORY)
    private readonly partidaRepository: IPartidaRepository,
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async execute(eventoId: number): Promise<Partida[]> {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento con ID ${eventoId} no existe`);
    }

    return this.partidaRepository.findByEventoId(eventoId);
  }
}
