import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { JUGADOR_REPOSITORY } from '../domain/jugador.repository.interface';
import type { IJugadorRepository } from '../domain/jugador.repository.interface';
import * as bcrypt from 'bcrypt';
import { RegistrarJugadorDto } from './registrar-jugador.dto';

@Injectable()
export class RegistrarJugadorUseCase {
  constructor(
    @Inject(JUGADOR_REPOSITORY)
    private readonly jugadorRepository: IJugadorRepository,
  ) {}

  async execute(dto: RegistrarJugadorDto) {
    const existeEmail = await this.jugadorRepository.findByEmail(dto.email);
    if (existeEmail) throw new ConflictException('El email ya está registrado.');

    const existeAlias = await this.jugadorRepository.findByAlias(dto.alias);
    if (existeAlias) throw new ConflictException('El alias ya está en uso.');

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    return this.jugadorRepository.create({
      alias: dto.alias,
      email: dto.email,
      passwordHash,
    });
  }
}