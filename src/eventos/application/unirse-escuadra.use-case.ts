import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';

@Injectable()
export class UnirseEscuadraUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async unirse(eventoId: number, escuadraId: number, jugadorId: number) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento #${eventoId} no existe`);
    }

    const miInscripcion = evento.jugadoresInscritos?.find((j) => j.jugadorId === jugadorId);
    if (!miInscripcion || !miInscripcion.bandoId) {
      throw new BadRequestException('Debes estar asignado a una facción/bando antes de unirte a una escuadra.');
    }

    const escuadra = await this.eventoRepository.obtenerEscuadra!(escuadraId);
    if (!escuadra) {
      throw new NotFoundException('La escuadra no existe.');
    }

    if (escuadra.bandoId !== miInscripcion.bandoId) {
      throw new BadRequestException('Esta escuadra pertenece a una facción distinta a la tuya.');
    }

    if (escuadra.cupoMax && escuadra._count?.jugadores >= escuadra.cupoMax) {
      throw new BadRequestException(`Esta escuadra ya completó su dotación máxima de ${escuadra.cupoMax} operadores.`);
    }

    // Si es EVENTO_MASIVO: verificar si el operador está habilitado en crono
    if (evento.tipo === 'EVENTO_MASIVO') {
      const tieneCronoAprobado = evento.registrosCrono?.some(
        (r) => r.jugadorId === jugadorId && r.aprobado === true,
      );
      if (!tieneCronoAprobado) {
        throw new BadRequestException(
          'Requiere homologación en crono: Debes acreditar tus réplicas en la mesa oficial de cronógrafo y ser aprobado antes de incorporarte a una escuadra táctica.',
        );
      }
    }

    await this.eventoRepository.asignarEscuadraJugador!(eventoId, jugadorId, escuadraId);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: `Te has incorporado exitosamente a la ${escuadra.nombre} 🪖`,
      escuadraId,
      evento: eventoActualizado,
    };
  }

  async salir(eventoId: number, jugadorId: number) {
    await this.eventoRepository.asignarEscuadraJugador!(eventoId, jugadorId, null);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: 'Has salido de tu escuadra. Ahora figuras como operador de reserva en tu facción.',
      evento: eventoActualizado,
    };
  }
}
