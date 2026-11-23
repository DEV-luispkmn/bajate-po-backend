import { Injectable, Inject } from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type {
  IEquipoRepository,
  FiltrosListarEquipos,
} from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';

@Injectable()
export class ListarEquiposUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
  ) {}

  async execute(filtros?: FiltrosListarEquipos): Promise<Equipo[]> {
    return this.equipoRepository.listar(filtros);
  }
}
