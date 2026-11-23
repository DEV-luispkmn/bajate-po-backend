import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';

@Injectable()
export class GestionarInscripcionesUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async execute(eventoId: number, abiertas: boolean, solicitanteId: number) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento #${eventoId} no existe`);
    }

    const esOrganizador = await this.eventoRepository.esOrganizador!(eventoId, solicitanteId);
    if (!esOrganizador) {
      throw new ForbiddenException('Solo un organizador de la operación puede gestionar el estado de las inscripciones.');
    }

    const actualizado = await this.eventoRepository.actualizarInscripciones!(eventoId, abiertas);
    return {
      mensaje: abiertas
        ? 'Inscripciones abiertas nuevamente para nuevos operadores.'
        : 'Inscripciones cerradas oficialmente. Se habilita la organización de escuadras.',
      evento: actualizado,
    };
  }
}
