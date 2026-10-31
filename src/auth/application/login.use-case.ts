import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JUGADOR_REPOSITORY } from '../../jugadores/domain/jugador.repository.interface';
import type { IJugadorRepository } from '../../jugadores/domain/jugador.repository.interface';
import { LoginDto } from './login.dto';
import { AuthResponse, JwtPayload } from '../domain/auth.types';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(JUGADOR_REPOSITORY)
    private readonly jugadorRepository: IJugadorRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponse> {
    const isEmail = dto.identificador.includes('@');
    const jugador = isEmail
      ? await this.jugadorRepository.findByEmail(dto.identificador)
      : await this.jugadorRepository.findByAlias(dto.identificador);

    if (!jugador) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(dto.password, jugador.passwordHash);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: jugador.id,
      email: jugador.email,
      alias: jugador.alias,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      jugador: {
        id: jugador.id,
        alias: jugador.alias,
        email: jugador.email,
        rango: jugador.rango,
        avatarUrl: jugador.avatarUrl,
        equipoId: jugador.equipoId,
      },
    };
  }
}
