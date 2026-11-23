import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import { UnirseEventoDto } from './unirse-evento.dto';
import { JugadorEnBando } from '../domain/evento.entity';

@Injectable()
export class UnirseEventoUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async execute(dto: UnirseEventoDto, jugadorId: number): Promise<JugadorEnBando> {
    const rol = dto.rol?.trim()
      ? dto.rol.toUpperCase()
      : (dto.replicas && dto.replicas.length > 0 ? dto.replicas[0].categoria : 'ASALTO');

    // Opción 1: Unirse escaneando el código QR del bando en la cancha
    if (dto.qrToken) {
      const bando = await this.eventoRepository.findBandoByQrToken(dto.qrToken);
      if (!bando) {
        throw new NotFoundException('El código QR escaneado no corresponde a ningún bando válido');
      }

      const evento = await this.eventoRepository.findById(bando.eventoId);
      if (!evento) {
        throw new NotFoundException('El evento del bando escaneado no existe');
      }
      this.validarInscripciones(evento, jugadorId);

      const bandoFinalId = await this.resolverBandoParaEvento(evento, jugadorId, bando.id);
      this.validarCupoBando(evento, jugadorId, bandoFinalId);

      const resultado = await this.eventoRepository.unirJugadorABando(
        bando.eventoId,
        jugadorId,
        bandoFinalId,
        rol,
      );

      if (dto.replicas && dto.replicas.length > 0 && this.eventoRepository.registrarReplicasDeclaradas) {
        await this.eventoRepository.registrarReplicasDeclaradas(bando.eventoId, jugadorId, dto.replicas);
      }

      return resultado;
    }

    // Opción 2: Unirse directamente por ID de evento (inscripción general o cambio de bando)
    if (dto.eventoId) {
      const evento = await this.eventoRepository.findById(dto.eventoId);
      if (!evento) {
        throw new NotFoundException(`El evento con ID ${dto.eventoId} no existe`);
      }
      this.validarInscripciones(evento, jugadorId);

      if (dto.bandoId) {
        const bandoExiste = evento.bandos?.some((b) => b.id === dto.bandoId);
        if (!bandoExiste) {
          throw new BadRequestException('El bando seleccionado no pertenece a este evento');
        }
      }

      const bandoFinalId = await this.resolverBandoParaEvento(evento, jugadorId, dto.bandoId);
      this.validarCupoBando(evento, jugadorId, bandoFinalId);

      const resultado = await this.eventoRepository.unirJugadorABando(
        evento.id,
        jugadorId,
        bandoFinalId,
        rol,
      );

      if (dto.replicas && dto.replicas.length > 0 && this.eventoRepository.registrarReplicasDeclaradas) {
        await this.eventoRepository.registrarReplicasDeclaradas(evento.id, jugadorId, dto.replicas);
      }

      return resultado;
    }

    // Opción 3: Unirse ingresando código de invitación táctico
    if (dto.codigoInvitacion) {
      const evento = await this.eventoRepository.findByCodigoInvitacion(dto.codigoInvitacion);
      if (!evento) {
        throw new NotFoundException('El código de invitación ingresado no existe');
      }
      this.validarInscripciones(evento, jugadorId);

      if (dto.bandoId) {
        const bandoExiste = evento.bandos?.some((b) => b.id === dto.bandoId);
        if (!bandoExiste) {
          throw new BadRequestException('El bando seleccionado no pertenece a este evento');
        }
      }

      const bandoFinalId = await this.resolverBandoParaEvento(evento, jugadorId, dto.bandoId);
      this.validarCupoBando(evento, jugadorId, bandoFinalId);

      const resultado = await this.eventoRepository.unirJugadorABando(
        evento.id,
        jugadorId,
        bandoFinalId,
        rol,
      );

      if (dto.replicas && dto.replicas.length > 0 && this.eventoRepository.registrarReplicasDeclaradas) {
        await this.eventoRepository.registrarReplicasDeclaradas(evento.id, jugadorId, dto.replicas);
      }

      return resultado;
    }

    throw new BadRequestException('Debes proporcionar un código QR, un código de invitación o el ID del evento');
  }

  private validarInscripciones(evento: any, jugadorId: number) {
    if (evento.estado === 'FINALIZADO' || evento.estado === 'CANCELADO') {
      throw new BadRequestException('No puedes unirte ni cambiarte de bando en un evento finalizado o cancelado');
    }
    if (evento.inscripcionesAbiertas === false) {
      const estaInscrito = evento.jugadoresInscritos?.some((j: any) => j.jugadorId === jugadorId);
      if (!estaInscrito) {
        throw new BadRequestException('Las inscripciones para este evento han sido cerradas oficialmente por la comandancia.');
      }
    }
  }

  /**
   * Lógica de asignación y restricción de bando para partidas de tipo VERSUS
   */
  private async resolverBandoParaEvento(
    evento: any,
    jugadorId: number,
    bandoDeseadoId?: number | null,
  ): Promise<number | null> {
    if (evento.tipo !== 'VERSUS') {
      return bandoDeseadoId ?? null;
    }

    const bandos = evento.bandos || [];
    const bandoA = bandos[0];
    const bandoB = bandos[1];

    const jugadorEquipoId = await this.eventoRepository.findJugadorEquipoId(jugadorId);

    // 1. Si pertenece a la Escuadra A: asignación obligatoria al Bando A
    if (jugadorEquipoId && evento.equipoAId && jugadorEquipoId === evento.equipoAId) {
      if (bandoDeseadoId && bandoB && bandoDeseadoId === bandoB.id) {
        throw new BadRequestException(
          'Perteneces oficialmente a la escuadra A y no puedes alistarte en la escuadra rival.',
        );
      }
      return bandoA ? bandoA.id : null;
    }

    // 2. Si pertenece a la Escuadra B: asignación obligatoria al Bando B
    if (jugadorEquipoId && evento.equipoBId && jugadorEquipoId === evento.equipoBId) {
      if (bandoDeseadoId && bandoA && bandoDeseadoId === bandoA.id) {
        throw new BadRequestException(
          'Perteneces oficialmente a la escuadra B y no puedes alistarte en la escuadra rival.',
        );
      }
      return bandoB ? bandoB.id : null;
    }

    // 3. Jugador invitado / parche / mercenario (no pertenece a ninguna de las 2 escuadras)
    const inscritos = await this.eventoRepository.obtenerJugadoresDeEvento(evento.id);
    const yaInscrito = inscritos.find((j) => j.jugadorId === jugadorId);

    // Si ya tenía bando elegido previamente y trata de cambiarse:
    if (yaInscrito && yaInscrito.bandoId) {
      if (bandoDeseadoId && bandoDeseadoId !== yaInscrito.bandoId) {
        throw new BadRequestException(
          'Como jugador invitado/refuerzo ya estás asignado a un bando y no puedes cambiarte de bando.',
        );
      }
      return yaInscrito.bandoId;
    }

    // Primera vez alistándose: puede elegir cuál bando reforzar
    return bandoDeseadoId ?? (bandoA ? bandoA.id : null);
  }

  private validarCupoBando(evento: any, jugadorId: number, bandoId?: number | null) {
    if (!bandoId) return;
    const bando = evento.bandos?.find((b: any) => b.id === bandoId);
    if (bando && bando.cupoMax && bando.cupoMax > 0) {
      const yaEnEsteBando = evento.jugadoresInscritos?.some(
        (j: any) => j.jugadorId === jugadorId && j.bandoId === bandoId,
      );
      if (!yaEnEsteBando) {
        const inscritos = evento.jugadoresInscritos?.filter(
          (j: any) => j.bandoId === bandoId,
        ) || [];
        if (inscritos.length >= bando.cupoMax) {
          throw new BadRequestException(
            `La facción "${bando.nombre}" ha completado su cupo máximo de ${bando.cupoMax} operadores.`,
          );
        }
      }
    }
  }
}
