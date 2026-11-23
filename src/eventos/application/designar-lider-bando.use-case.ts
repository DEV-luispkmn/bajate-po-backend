import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';

@Injectable()
export class DesignarLiderBandoUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async execute(eventoId: number, bandoId: number, nuevoLiderId: number | null, solicitanteId: number) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento #${eventoId} no existe`);
    }

    const esOrganizador = await this.eventoRepository.esOrganizador!(eventoId, solicitanteId);
    if (!esOrganizador) {
      throw new ForbiddenException('Solo la comandancia organizadora puede designar líderes de bando.');
    }

    const bando = evento.bandos?.find((b) => b.id === bandoId);
    if (!bando) {
      throw new BadRequestException('El bando especificado no pertenece a este evento.');
    }

    await this.eventoRepository.designarLiderBando!(bandoId, nuevoLiderId);

    const eventoActualizado = await this.eventoRepository.findById(eventoId);
    return {
      mensaje: nuevoLiderId
        ? `Líder de facción (${bando.nombre}) asignado exitosamente.`
        : `Líder de facción (${bando.nombre}) desasignado.`,
      evento: eventoActualizado,
    };
  }
}
