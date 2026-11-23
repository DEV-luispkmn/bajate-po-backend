import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import { ModificarEventoDto } from './modificar-evento.dto';
import { Evento } from '../domain/evento.entity';

@Injectable()
export class ModificarEventoUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async execute(
    eventoId: number,
    dto: ModificarEventoDto,
    jugadorId: number,
  ): Promise<Evento> {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento con ID ${eventoId} no existe`);
    }

    const esOrganizador = this.eventoRepository.esOrganizador
      ? await this.eventoRepository.esOrganizador(eventoId, jugadorId)
      : evento.organizadorId === jugadorId;

    if (!esOrganizador && evento.organizadorId !== jugadorId) {
      throw new ForbiddenException('Solo el organizador puede modificar este evento');
    }

    const ahora = new Date();

    if (dto.fechaInicio) {
      const inicio = new Date(dto.fechaInicio);
      if (isNaN(inicio.getTime())) {
        throw new BadRequestException('La fecha y hora de inicio no tiene un formato válido.');
      }
      if (inicio.getTime() < ahora.getTime() - 60000) {
        throw new BadRequestException(
          'No se puede programar una partida para una fecha anterior a la actual.',
        );
      }
    }

    if (dto.fechaFin) {
      const fin = new Date(dto.fechaFin);
      if (isNaN(fin.getTime())) {
        throw new BadRequestException('La fecha y hora de término no tiene un formato válido.');
      }
      const fechaInicioEval = dto.fechaInicio ? new Date(dto.fechaInicio) : evento.fechaInicio;
      if (fechaInicioEval && fin.getTime() <= fechaInicioEval.getTime()) {
        throw new BadRequestException(
          'La fecha y hora de término debe ser posterior a la fecha y hora de inicio.',
        );
      }
    }

    if (dto.tacsop && this.eventoRepository.guardarTacsop) {
      await this.eventoRepository.guardarTacsop(eventoId, dto.tacsop);
    }

    return this.eventoRepository.modificar(eventoId, {
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      canchaId: dto.canchaId,
      fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : undefined,
      fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
      region: dto.region,
      ciudad: dto.ciudad,
    });
  }
}
