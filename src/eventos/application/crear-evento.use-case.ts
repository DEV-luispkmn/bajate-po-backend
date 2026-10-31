import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import { CANCHA_REPOSITORY } from '../../canchas/domain/cancha.repository.interface';
import type { ICanchaRepository } from '../../canchas/domain/cancha.repository.interface';
import { CrearEventoDto } from './crear-evento.dto';
import { Evento } from '../domain/evento.entity';

@Injectable()
export class CrearEventoUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
    @Inject(CANCHA_REPOSITORY)
    private readonly canchaRepository: ICanchaRepository,
  ) {}

  async execute(dto: CrearEventoDto, organizadorId: number): Promise<Evento> {
    const cancha = await this.canchaRepository.findById(dto.canchaId);
    if (!cancha) {
      throw new NotFoundException(`La cancha con ID ${dto.canchaId} no existe`);
    }

    // Generar código de invitación único (ej: BP-7A9B3)
    const codigoInvitacion = `BP-${randomBytes(3).toString('hex').toUpperCase()}`;

    // Configurar bandos (si no envía ninguno, por defecto Alfa y Bravo)
    const bandosDefecto = [
      { nombre: 'Bando Alfa', colorHex: '#E53E3E' },
      { nombre: 'Bando Bravo', colorHex: '#3182CE' },
    ];

    const bandosInput = dto.bandos && dto.bandos.length >= 2 ? dto.bandos : bandosDefecto;

    const bandosConQr = bandosInput.map((b) => ({
      nombre: b.nombre,
      colorHex: b.colorHex,
      qrToken: `bando_${randomBytes(16).toString('hex')}`,
    }));

    return this.eventoRepository.create({
      titulo: dto.titulo,
      tipo: dto.tipo,
      privacidad: dto.privacidad,
      canchaId: dto.canchaId,
      organizadorId,
      fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : undefined,
      codigoInvitacion,
      bandos: bandosConQr,
    });
  }
}
