import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import { Evento, JugadorEnBando } from '../domain/evento.entity';

export interface DetalleEventoResponse {
  evento: Evento;
  jugadores: JugadorEnBando[];
}

@Injectable()
export class ObtenerEventoUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async execute(id: number): Promise<DetalleEventoResponse> {
    const evento = await this.eventoRepository.findById(id);
    if (!evento) {
      throw new NotFoundException(`El evento con ID ${id} no existe`);
    }

    const jugadores = await this.eventoRepository.obtenerJugadoresDeEvento(id);

    return {
      evento,
      jugadores,
    };
  }
}
