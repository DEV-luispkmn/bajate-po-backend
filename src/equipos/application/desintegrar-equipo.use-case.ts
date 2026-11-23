import { Injectable, Inject, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';

@Injectable()
export class DesintegrarEquipoUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
  ) {}

  async execute(jugadorId: number): Promise<{ mensaje: string }> {
    if (!jugadorId) {
      throw new BadRequestException('Operación no permitida: Operador no identificado.');
    }

    const miEquipo = await this.equipoRepository.obtenerMiEquipo(jugadorId);
    if (!miEquipo) {
      throw new NotFoundException('Actualmente no perteneces a ninguna escuadra.');
    }

    // Solo el Team Leader (TL) o el fundador tienen potestad para desintegrar la escuadra
    const esTL = miEquipo.tlId === jugadorId;
    const esFundador = miEquipo.fundadorId === jugadorId;

    if (!esTL && !esFundador) {
      throw new ForbiddenException(
        'Solo el Team Leader (TL) oficial o el fundador tienen atribuciones para desintegrar el equipo.',
      );
    }

    await this.equipoRepository.desintegrar(miEquipo.id);

    return {
      mensaje: `La escuadra "${miEquipo.nombre}" ha sido desintegrada definitivamente y eliminada del radar táctico.`,
    };
  }
}
