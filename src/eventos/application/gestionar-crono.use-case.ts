import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import { RegistrarCronoReplicaDto } from './gestionar-crono.dto';

@Injectable()
export class GestionarCronoUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  private async validarOrganizador(eventoId: number, solicitanteId: number) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento #${eventoId} no existe`);
    }

    const esOrganizador = await this.eventoRepository.esOrganizador!(eventoId, solicitanteId);
    if (!esOrganizador) {
      throw new ForbiddenException('Solo un organizador o juez de cronógrafo puede registrar mediciones.');
    }

    return evento;
  }

  async registrarReplica(eventoId: number, dto: RegistrarCronoReplicaDto, solicitanteId: number) {
    await this.validarOrganizador(eventoId, solicitanteId);

    const registro = await this.eventoRepository.registrarCronoReplica!({
      ...dto,
      eventoId,
      cronoPorId: solicitanteId,
    });

    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: `Réplica (${dto.categoria}) cronada exitosamente: ${dto.joules} J ${dto.aprobado !== false ? '✅ [APROBADA]' : '❌ [RECHAZADA]'}`,
      registro,
      evento: eventoActualizado,
    };
  }

  async eliminarRegistro(eventoId: number, cronoId: number, solicitanteId: number) {
    await this.validarOrganizador(eventoId, solicitanteId);

    await this.eventoRepository.eliminarRegistroCrono!(cronoId);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: 'Registro de crono eliminado.',
      evento: eventoActualizado,
    };
  }
}
