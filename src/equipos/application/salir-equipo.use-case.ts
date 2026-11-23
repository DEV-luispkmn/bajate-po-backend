import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';

@Injectable()
export class SalirEquipoUseCase {
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
      throw new BadRequestException('Actualmente no perteneces a ningún equipo.');
    }

    const esTL = miEquipo.tlId === jugadorId;

    // Si es el Team Leader (TL)
    if (esTL) {
      if (miEquipo.totalMiembros <= 1) {
        // Al ser el único miembro y TL, la escuadra se desintegra directamente
        await this.equipoRepository.desintegrar(miEquipo.id);
        return {
          mensaje: `Has disuelto y desintegrado la escuadra "${miEquipo.nombre}" al ser el único miembro.`,
        };
      } else {
        throw new BadRequestException(
          'Como Team Leader (TL) no puedes abandonar la escuadra mientras tenga miembros activos. Debes transferir el mando de TL a otro operador o desintegrar el equipo.',
        );
      }
    }

    // Miembro regular
    await this.equipoRepository.salirJugador(jugadorId);
    return { mensaje: `Te has desvinculado exitosamente de "${miEquipo.nombre}".` };
  }
}
