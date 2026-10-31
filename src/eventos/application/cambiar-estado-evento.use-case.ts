import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import { CambiarEstadoEventoDto } from './cambiar-estado-evento.dto';
import { Evento, EstadoEvento } from '../domain/evento.entity';

@Injectable()
export class CambiarEstadoEventoUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async execute(
    eventoId: number,
    dto: CambiarEstadoEventoDto,
    jugadorId: number,
  ): Promise<Evento> {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento con ID ${eventoId} no existe`);
    }

    if (evento.organizadorId !== jugadorId) {
      throw new ForbiddenException('Solo el organizador del evento puede cambiar su estado');
    }

    return this.eventoRepository.actualizarEstado(eventoId, dto.estado as EstadoEvento);
  }
}
