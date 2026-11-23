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

  async execute(dto: CrearCanchaDto, creadorId?: number): Promise<Cancha> {
    return this.canchaRepository.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      region: dto.region,
      ciudad: dto.ciudad,
      latitud: dto.latitud,
      longitud: dto.longitud,
      esAbierta: dto.esAbierta !== undefined ? dto.esAbierta : true,
      adminEquipoId: dto.adminEquipoId,
      creadorId,
      activa: false,
      estado: 'EN_REVISION',
      fotos: dto.fotos?.map((f) => ({
        url: f.url,
        descripcion: f.descripcion,
      })),
    });
  }
}
