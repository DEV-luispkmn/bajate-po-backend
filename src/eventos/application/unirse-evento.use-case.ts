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
    const rol = dto.rol?.trim() ? dto.rol.toUpperCase() : 'ASALTO';

    // Opción 1: Unirse escaneando el código QR del bando en la cancha
    if (dto.qrToken) {
      const bando = await this.eventoRepository.findBandoByQrToken(dto.qrToken);
      if (!bando) {
        throw new NotFoundException('El código QR escaneado no corresponde a ningún bando válido');
      }

      return this.eventoRepository.unirJugadorABando(
        bando.eventoId,
        jugadorId,
        bando.id,
        rol,
      );
    }

    // Opción 2: Unirse ingresando código de invitación y seleccionando bando
    if (dto.codigoInvitacion) {
      const evento = await this.eventoRepository.findByCodigoInvitacion(dto.codigoInvitacion);
      if (!evento) {
        throw new NotFoundException('El código de invitación ingresado no existe');
      }

      if (!dto.bandoId) {
        throw new BadRequestException('Debes seleccionar un bando para unirte con código de invitación');
      }

      const bandoExiste = evento.bandos?.some((b) => b.id === dto.bandoId);
      if (!bandoExiste) {
        throw new BadRequestException('El bando seleccionado no pertenece a este evento');
      }

      return this.eventoRepository.unirJugadorABando(
        evento.id,
        jugadorId,
        dto.bandoId,
        rol,
      );
    }

    throw new BadRequestException('Debes proporcionar un código QR o un código de invitación');
  }
}
