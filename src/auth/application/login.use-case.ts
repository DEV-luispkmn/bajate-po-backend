import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JUGADOR_REPOSITORY } from '../../jugadores/domain/jugador.repository.interface';
import type { IJugadorRepository } from '../../jugadores/domain/jugador.repository.interface';
import { LoginDto } from './login.dto';
import { AuthResponse, JwtPayload } from '../domain/auth.types';
import { LoginRateLimiterService } from './login-rate-limiter.service';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(JUGADOR_REPOSITORY)
    private readonly jugadorRepository: IJugadorRepository,
    private readonly jwtService: JwtService,
    private readonly rateLimiter: LoginRateLimiterService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponse> {
    const identificador = dto.identificador?.trim() || '';

    // 1. Verificar si el identificador se encuentra bloqueado por exceder 3 intentos
    this.rateLimiter.verificarBloqueo(identificador);

    // 2. Si la contraseña no cumple con el largo mínimo (8 caracteres), cuenta como intento fallido
    if (!dto.password || dto.password.length < 8) {
      this.rateLimiter.registrarFallo(
        identificador,
        'La contraseña debe tener al menos 8 caracteres.',
      );
    }

    const isEmail = identificador.includes('@');
    const jugador = isEmail
      ? await this.jugadorRepository.findByEmail(identificador)
      : await this.jugadorRepository.findByAlias(identificador);

    if (!jugador) {
      this.rateLimiter.registrarFallo(identificador);
    }

    const passwordValida = await bcrypt.compare(dto.password, jugador!.passwordHash);
    if (!passwordValida) {
      this.rateLimiter.registrarFallo(identificador);
    }

    // 2. Si las credenciales fueron correctas, resetear intentos fallidos continuos
    this.rateLimiter.registrarExito(identificador);

    const payload: JwtPayload = {
      sub: jugador!.id,
      email: jugador!.email,
      alias: jugador!.alias,
      esAdmin: jugador!.esAdmin,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      jugador: {
        id: jugador!.id,
        alias: jugador!.alias,
        email: jugador!.email,
        rango: jugador!.rango,
        avatarUrl: jugador!.avatarUrl,
        region: jugador!.region,
        ciudad: jugador!.ciudad,
        roles: jugador!.roles,
        equipoId: jugador!.equipoId,
        esAdmin: jugador!.esAdmin,
      },
    };
  }
}
