import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';

@Injectable()
export class UnirseEquipoUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
  ) {}

  async execute(
    jugadorId: number,
    identificador: { equipoId?: number; codigoAcceso?: string },
  ): Promise<Equipo> {
    if (!jugadorId) {
      throw new BadRequestException('Operación no permitida: Operador no identificado.');
    }

    let equipo: Equipo | null = null;

    if (identificador.equipoId) {
      equipo = await this.equipoRepository.buscarPorId(identificador.equipoId);
    } else if (identificador.codigoAcceso?.trim()) {
      equipo = await this.equipoRepository.buscarPorCodigo(identificador.codigoAcceso.trim().toUpperCase());
    }

    if (!equipo) {
      throw new NotFoundException('No se encontró el equipo indicado');
    }

    if (!equipo.activo) {
      throw new BadRequestException('Esta escuadra fue desintegrada y ya no se encuentra activa.');
    }

    // Si intenta unirse directamente por ID (sin código) y las postulaciones están cerradas:
    if (identificador.equipoId && !identificador.codigoAcceso && !equipo.postulacionesAbiertas) {
      throw new BadRequestException(
        `Las postulaciones para "${equipo.nombre}" están cerradas por el Team Leader (TL). Solicita un código de reclutamiento oficial.`,
      );
    }

    const miEquipoActual = await this.equipoRepository.obtenerMiEquipo(jugadorId);
    if (miEquipoActual) {
      if (miEquipoActual.id === equipo.id) {
        throw new BadRequestException('Ya formas parte de esta escuadra táctica.');
      }
      // Si ya tiene equipo, transferir
      await this.equipoRepository.salirJugador(jugadorId);
    }

    await this.equipoRepository.unirJugador(equipo.id, jugadorId);

    const equipoActualizado = await this.equipoRepository.buscarPorId(equipo.id);
    return equipoActualizado || equipo;
  }
}
