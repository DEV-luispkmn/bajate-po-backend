import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import { CrearEscuadraDto, GenerarEscuadrasDto } from './gestionar-escuadras.dto';

@Injectable()
export class GestionarEscuadrasUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  private async validarPermisosMando(eventoId: number, bandoId: number, solicitanteId: number) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento #${eventoId} no existe`);
    }

    if (evento.inscripcionesAbiertas !== false) {
      throw new BadRequestException(
        'Debes cerrar las inscripciones de la operación antes de habilitar o gestionar escuadras tácticas.',
      );
    }

    const bando = evento.bandos?.find((b) => b.id === bandoId);
    if (!bando) {
      throw new BadRequestException('El bando especificado no pertenece a este evento.');
    }

    const esOrganizador = await this.eventoRepository.esOrganizador!(eventoId, solicitanteId);
    const esLiderBando = bando.liderId === solicitanteId;

    if (!esOrganizador && !esLiderBando) {
      throw new ForbiddenException('No tienes permisos de organizador ni de líder de bando para gestionar escuadras.');
    }

    return { evento, bando };
  }

  async crearEscuadra(eventoId: number, bandoId: number, dto: CrearEscuadraDto, solicitanteId: number) {
    await this.validarPermisosMando(eventoId, bandoId, solicitanteId);

    const escuadra = await this.eventoRepository.crearEscuadra!(
      bandoId,
      dto.nombre.trim(),
      dto.cupoMax ?? 10,
      dto.liderId,
    );

    const eventoActualizado = await this.eventoRepository.findById(eventoId);
    return {
      mensaje: `Escuadra "${dto.nombre}" habilitada para el despliegue.`,
      escuadra,
      evento: eventoActualizado,
    };
  }

  async generarEscuadras(eventoId: number, bandoId: number, dto: GenerarEscuadrasDto, solicitanteId: number) {
    const { bando } = await this.validarPermisosMando(eventoId, bandoId, solicitanteId);

    const prefijo = dto.prefijo?.trim() || `${bando.nombre} - Escuadra`;
    const cupoMax = dto.cupoMax ?? 10;
    const escuadrasCreadas = [];

    const escuadrasActualesCount = bando.escuadras?.length || 0;

    for (let i = 1; i <= dto.cantidad; i++) {
      const numero = escuadrasActualesCount + i;
      const nombreEscuadra = `${prefijo} ${numero}`;
      const creada = await this.eventoRepository.crearEscuadra!(bandoId, nombreEscuadra, cupoMax);
      escuadrasCreadas.push(creada);
    }

    const eventoActualizado = await this.eventoRepository.findById(eventoId);
    return {
      mensaje: `Se habilitaron exitosamente ${dto.cantidad} escuadras para ${bando.nombre}.`,
      escuadras: escuadrasCreadas,
      evento: eventoActualizado,
    };
  }

  async eliminarEscuadra(eventoId: number, escuadraId: number, solicitanteId: number) {
    const escuadra = await this.eventoRepository.obtenerEscuadra!(escuadraId);
    if (!escuadra) {
      throw new NotFoundException('La escuadra especificada no existe.');
    }

    await this.validarPermisosMando(eventoId, escuadra.bandoId, solicitanteId);
    await this.eventoRepository.eliminarEscuadra!(escuadraId);

    const eventoActualizado = await this.eventoRepository.findById(eventoId);
    return {
      mensaje: 'Escuadra desmantelada exitosamente.',
      evento: eventoActualizado,
    };
  }
}
