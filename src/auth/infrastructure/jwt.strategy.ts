import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../domain/auth.types';
import { JUGADOR_REPOSITORY } from '../../jugadores/domain/jugador.repository.interface';
import type { IJugadorRepository } from '../../jugadores/domain/jugador.repository.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(JUGADOR_REPOSITORY)
    private readonly jugadorRepository: IJugadorRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'bajate-po-secret-key-2026',
    });
  }

  async validate(payload: JwtPayload) {
    const jugador = await this.jugadorRepository.findById(payload.sub);
    if (!jugador) {
      throw new UnauthorizedException('Jugador no encontrado o sesión no válida');
    }
    const { passwordHash: _passwordHash, ...jugadorPublico } = jugador;
    return jugadorPublico;
  }
}
