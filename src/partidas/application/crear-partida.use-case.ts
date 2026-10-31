import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PARTIDA_REPOSITORY } from '../domain/partida.repository.interface';
import type { IPartidaRepository } from '../domain/partida.repository.interface';
import { EVENTO_REPOSITORY } from '../../eventos/domain/evento.repository.interface';
import type { IEventoRepository } from '../../eventos/domain/evento.repository.interface';
import { CrearPartidaDto } from './crear-partida.dto';
import { Partida } from '../domain/partida.entity';

@Injectable()
export class CrearPartidaUseCase {
  constructor(
    @Inject(PARTIDA_REPOSITORY)
    private readonly partidaRepository: IPartidaRepository,
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async execute(dto: CrearPartidaDto): Promise<Partida> {
    const evento = await this.eventoRepository.findById(dto.eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento con ID ${dto.eventoId} no existe`);
    }

    return this.partidaRepository.create({
      eventoId: dto.eventoId,
      nombre: dto.nombre ?? 'Partida Principal',
    });
  }
}
