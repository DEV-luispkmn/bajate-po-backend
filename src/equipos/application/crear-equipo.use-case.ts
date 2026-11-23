import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { CrearEquipoDto } from './crear-equipo.dto';
import { Equipo } from '../domain/equipo.entity';

@Injectable()
export class CrearEquipoUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
  ) {}

  async execute(dto: CrearEquipoDto, jugadorId: number): Promise<Equipo> {
    if (!jugadorId) {
      throw new BadRequestException('Operación no permitida: Operador no identificado.');
    }

    if (!dto.nombre?.trim()) {
      throw new BadRequestException('El nombre del equipo es obligatorio');
    }

    // Verificar si el jugador ya pertenece a un equipo
    const miEquipoActual = await this.equipoRepository.obtenerMiEquipo(jugadorId);
    if (miEquipoActual) {
      throw new BadRequestException(
        `Ya perteneces a la escuadra "${miEquipoActual.nombre}". Debes desvincularte antes de fundar un nuevo equipo.`,
      );
    }

    // Generar código de acceso mnemotécnico de 6 caracteres
    const prefijo = dto.nombre
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z]/g, '')
      .toUpperCase()
      .slice(0, 4)
      .padEnd(3, 'T');

    const sufijoNum = Math.floor(100 + Math.random() * 900);
    const codigoAcceso = `${prefijo}${sufijoNum}`.slice(0, 6);

    const nuevoEquipo = await this.equipoRepository.crear(
      {
        nombre: dto.nombre.trim(),
        lema: dto.lema?.trim() || null,
        descripcion: dto.descripcion?.trim() || null,
        logoUrl: dto.logoUrl || null,
        region: dto.region?.trim() || null,
        ciudad: dto.ciudad?.trim() || null,
        codigoAcceso,
      },
      jugadorId,
    );

    return nuevoEquipo;
  }
}
