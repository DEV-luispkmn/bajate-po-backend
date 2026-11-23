import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import { GuardarTacsopDto, ActualizarCommsDto, ActualizarMapaTacticoDto } from './gestionar-tacsop.dto';

@Injectable()
export class GestionarTacsopUseCase {
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
      throw new ForbiddenException('Solo un organizador de la operación puede gestionar el TACSOP o las COMMS.');
    }

    return evento;
  }

  async guardarTacsop(eventoId: number, dto: GuardarTacsopDto, solicitanteId: number) {
    await this.validarOrganizador(eventoId, solicitanteId);

    const tacsop = await this.eventoRepository.guardarTacsop!(eventoId, dto);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: 'TACSOP y reglas operativas actualizadas exitosamente.',
      tacsop,
      evento: eventoActualizado,
    };
  }

  async actualizarCommsBando(
    eventoId: number,
    bandoId: number,
    dto: ActualizarCommsDto,
    solicitanteId: number,
  ) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) throw new NotFoundException('El evento no existe.');

    const bando = evento.bandos?.find((b) => b.id === bandoId);
    if (!bando) throw new NotFoundException('El bando no pertenece a este evento.');

    const esOrg = await this.eventoRepository.esOrganizador!(eventoId, solicitanteId);
    const esLiderBando = bando.liderId === solicitanteId;

    if (!esOrg && !esLiderBando) {
      throw new ForbiddenException('No tienes permisos para modificar las COMMS de este bando.');
    }

    await this.eventoRepository.actualizarCommsBando!(bandoId, dto.frecuenciaRadio, dto.subtonoRadio);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: `Frecuencia Baofeng de la facción "${bando.nombre}" actualizada.`,
      evento: eventoActualizado,
    };
  }

  async actualizarCommsEscuadra(
    eventoId: number,
    escuadraId: number,
    dto: ActualizarCommsDto,
    solicitanteId: number,
  ) {
    const escuadra = await this.eventoRepository.obtenerEscuadra!(escuadraId);
    if (!escuadra) throw new NotFoundException('La escuadra no existe.');

    const esOrg = await this.eventoRepository.esOrganizador!(eventoId, solicitanteId);
    const esLiderEscuadra = escuadra.liderId === solicitanteId;

    if (!esOrg && !esLiderEscuadra) {
      throw new ForbiddenException('No tienes permisos para modificar las COMMS de esta escuadra.');
    }

    await this.eventoRepository.actualizarCommsEscuadra!(escuadraId, dto.frecuenciaRadio, dto.subtonoRadio);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: `Canal de radio de la escuadra "${escuadra.nombre}" configurado.`,
      evento: eventoActualizado,
    };
  }

  async actualizarMapaTactico(
    eventoId: number,
    dto: ActualizarMapaTacticoDto,
    solicitanteId: number,
  ) {
    await this.validarOrganizador(eventoId, solicitanteId);

    await this.eventoRepository.actualizarMapaTactico!(
      eventoId,
      dto.mapaTacticoUrl,
      dto.mapaPines,
    );
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: 'Mapa táctico y pines de cuadrícula guardados exitosamente.',
      evento: eventoActualizado,
    };
  }
}
