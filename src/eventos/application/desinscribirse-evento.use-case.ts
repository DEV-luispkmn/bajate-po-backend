import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';

@Injectable()
export class DesinscribirseEventoUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async execute(eventoId: number, jugadorId: number): Promise<{ mensaje: string }> {
    const evId = Number(eventoId);
    const jId = Number(jugadorId);

    if (!jId) {
      throw new BadRequestException('Operación no permitida: Operador no identificado.');
    }

    const evento = await this.eventoRepository.findById(evId);
    if (!evento) {
      throw new NotFoundException(`La operación con ID ${evId} no existe`);
    }

    if (evento.estado === 'FINALIZADO' || evento.estado === 'CANCELADO') {
      throw new BadRequestException(
        `No es posible desinscribirse de una operación ${evento.estado.toLowerCase()}.`,
      );
    }

    const jugadores = await this.eventoRepository.obtenerJugadoresDeEvento(evId);
    const estaInscrito = jugadores.some((j) => Number(j.jugadorId) === jId);

    if (!estaInscrito) {
      // Si el operador es el organizador del evento y no figura en la lista de jugadores combatientes
      // (por ejemplo, creó el evento como comisario/admin sin cupo de bando), confirmamos la salida
      // limpiamente sin arrojar error al usuario.
      if (Number(evento.organizadorId) === jId) {
        return {
          mensaje: `Como comandante organizador de "${evento.titulo}", tu cupo como combatiente ha sido liberado de la operación.`,
        };
      }

      throw new BadRequestException('No te encuentras inscrito en esta operación.');
    }

    await this.eventoRepository.desinscribirJugador(evId, jId);

    return {
      mensaje: `Te has bajado exitosamente de la operación "${evento.titulo}". Tu cupo en el bando ha sido liberado.`,
    };
  }
}
