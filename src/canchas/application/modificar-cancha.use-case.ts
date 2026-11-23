import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CANCHA_REPOSITORY } from '../domain/cancha.repository.interface';
import type { ICanchaRepository } from '../domain/cancha.repository.interface';
import { ModificarCanchaDto } from './modificar-cancha.dto';
import { Cancha } from '../domain/cancha.entity';

@Injectable()
export class ModificarCanchaUseCase {
  constructor(
    @Inject(CANCHA_REPOSITORY)
    private readonly canchaRepository: ICanchaRepository,
  ) {}

  async execute(id: number, dto: ModificarCanchaDto): Promise<Cancha> {
    const canchaExistente = await this.canchaRepository.findById(id);
    if (!canchaExistente) {
      throw new NotFoundException(`La cancha #${id} no fue encontrada en el radar.`);
    }

    return this.canchaRepository.update(id, {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      region: dto.region,
      ciudad: dto.ciudad,
      latitud: dto.latitud,
      longitud: dto.longitud,
      esAbierta: dto.esAbierta,
      adminEquipoId: dto.adminEquipoId,
    });
  }
}
