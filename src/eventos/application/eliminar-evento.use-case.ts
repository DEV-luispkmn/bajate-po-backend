import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';

@Injectable()
export class EliminarEventoUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async execute(eventoId: number, jugadorId: number): Promise<void> {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento con ID ${eventoId} no existe`);
    }

    if (evento.organizadorId !== jugadorId) {
      throw new ForbiddenException('Solo el organizador puede eliminar este evento');
    }

    await this.eventoRepository.eliminar(eventoId);
  }
}
