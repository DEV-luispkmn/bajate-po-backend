import { Injectable, Inject } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository, FiltrosListarEventos } from '../domain/evento.repository.interface';
import { Evento } from '../domain/evento.entity';

@Injectable()
export class ListarEventosUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async execute(filtros?: FiltrosListarEventos): Promise<Evento[]> {
    return this.eventoRepository.findAll(filtros);
  }
}
