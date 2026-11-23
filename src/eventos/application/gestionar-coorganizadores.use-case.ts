import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';

@Injectable()
export class GestionarCoorganizadoresUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async agregar(eventoId: number, nuevoOrganizadorId: number, solicitanteId: number) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento #${eventoId} no existe`);
    }

    if (evento.organizadorId !== solicitanteId) {
      throw new ForbiddenException('Solo el comandante creador de la operación puede nombrar co-organizadores.');
    }

    if (nuevoOrganizadorId === evento.organizadorId) {
      throw new BadRequestException('El usuario ya es el organizador principal de este evento.');
    }

    await this.eventoRepository.agregarCoorganizador!(eventoId, nuevoOrganizadorId);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: 'Co-organizador añadido exitosamente con privilegios de mando.',
      evento: eventoActualizado,
    };
  }

  async remover(eventoId: number, coorganizadorId: number, solicitanteId: number) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento #${eventoId} no existe`);
    }

    if (evento.organizadorId !== solicitanteId) {
      throw new ForbiddenException('Solo el comandante creador de la operación puede remover co-organizadores.');
    }

    await this.eventoRepository.removerCoorganizador!(eventoId, coorganizadorId);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: 'Co-organizador removido de la comandancia.',
      evento: eventoActualizado,
    };
  }
}
