import { Injectable, Inject } from '@nestjs/common';
import { CANCHA_REPOSITORY } from '../domain/cancha.repository.interface';
import type { ICanchaRepository } from '../domain/cancha.repository.interface';
import { Cancha } from '../domain/cancha.entity';

@Injectable()
export class ListarCanchasUseCase {
  constructor(
    @Inject(CANCHA_REPOSITORY)
    private readonly canchaRepository: ICanchaRepository,
  ) {}

  async execute(): Promise<Cancha[]> {
    return this.canchaRepository.findAll();
  }
}
