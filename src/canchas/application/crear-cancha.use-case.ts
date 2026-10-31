import { Injectable, Inject } from '@nestjs/common';
import { CANCHA_REPOSITORY } from '../domain/cancha.repository.interface';
import type { ICanchaRepository } from '../domain/cancha.repository.interface';
import { CrearCanchaDto } from './crear-cancha.dto';
import { Cancha } from '../domain/cancha.entity';

@Injectable()
export class CrearCanchaUseCase {
  constructor(
    @Inject(CANCHA_REPOSITORY)
    private readonly canchaRepository: ICanchaRepository,
  ) {}

  async execute(dto: CrearCanchaDto): Promise<Cancha> {
    return this.canchaRepository.create({
      nombre: dto.nombre,
      latitud: dto.latitud,
      longitud: dto.longitud,
      adminEquipoId: dto.adminEquipoId,
    });
  }
}
