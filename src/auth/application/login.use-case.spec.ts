import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import { IJugadorRepository } from '../../jugadores/domain/jugador.repository.interface';
import { JwtService } from '@nestjs/jwt';
import { Jugador } from '../../jugadores/domain/jugador.entity';
import { LoginRateLimiterService } from './login-rate-limiter.service';
import * as bcrypt from 'bcrypt';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let repoMock: jest.Mocked<IJugadorRepository>;
  let jwtMock: jest.Mocked<JwtService>;
  let rateLimiter: LoginRateLimiterService;

  beforeEach(() => {
    repoMock = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByAlias: jest.fn(),
      findById: jest.fn(),
    } as any;
    jwtMock = {
      signAsync: jest.fn().mockResolvedValue('jwt_token_simulado'),
    } as any;
    rateLimiter = new LoginRateLimiterService();

    useCase = new LoginUseCase(repoMock, jwtMock, rateLimiter);
  });

  it('debe iniciar sesión correctamente con credenciales válidas por email', async () => {
    const passwordPlana = 'Password123!';
    const hash = await bcrypt.hash(passwordPlana, 10);
    const mockJugador = new Jugador(1, 'GhillieKing', 'ghillie@airsoft.cl', hash, new Date());

    repoMock.findByEmail.mockResolvedValue(mockJugador);

    const result = await useCase.execute({
      identificador: 'ghillie@airsoft.cl',
      password: passwordPlana,
    });

    expect(result).toBeDefined();
    expect(result.accessToken).toBe('jwt_token_simulado');
    expect(result.jugador.alias).toBe('GhillieKing');
    expect(jwtMock.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'ghillie@airsoft.cl',
      alias: 'GhillieKing',
    });
  });

  it('debe iniciar sesión correctamente con credenciales válidas por alias', async () => {
    const passwordPlana = 'Password123!';
    const hash = await bcrypt.hash(passwordPlana, 10);
    const mockJugador = new Jugador(2, 'DeltaOne', 'delta@airsoft.cl', hash, new Date());

    repoMock.findByAlias.mockResolvedValue(mockJugador);

    const result = await useCase.execute({
      identificador: 'DeltaOne',
      password: passwordPlana,
    });

    expect(result).toBeDefined();
    expect(result.accessToken).toBe('jwt_token_simulado');
    expect(result.jugador.id).toBe(2);
  });

  it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
    repoMock.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        identificador: 'noexiste@airsoft.cl',
        password: 'Password123!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debe lanzar UnauthorizedException si la contraseña no coincide', async () => {
    const hash = await bcrypt.hash('Correcta123!', 10);
    const mockJugador = new Jugador(3, 'Bravo', 'bravo@airsoft.cl', hash, new Date());
    repoMock.findByEmail.mockResolvedValue(mockJugador);

    await expect(
      useCase.execute({
        identificador: 'bravo@airsoft.cl',
        password: 'Equivocada123!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debe rechazar y contar como intento fallido si la contraseña tiene menos de 8 caracteres', async () => {
    const hash = await bcrypt.hash('Correcta123!', 10);
    const mockJugador = new Jugador(3, 'Bravo', 'bravo@airsoft.cl', hash, new Date());
    repoMock.findByEmail.mockResolvedValue(mockJugador);

    try {
      await useCase.execute({
        identificador: 'bravo@airsoft.cl',
        password: 'corta',
      });
      throw new Error('Debió fallar');
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.message).toContain('La contraseña debe tener al menos 8 caracteres');
      expect(err.message).toContain('Te quedan 2 intentos');
    }
  });

  it('debe bloquear con 429 al alcanzar exactamente 3 intentos continuos fallidos e imponer 1 minuto de cooldown', async () => {
    const hash = await bcrypt.hash('PasswordSegura123!', 10);
    const mockJugador = new Jugador(4, 'SniperGhost', 'sniper@airsoft.cl', hash, new Date());
    repoMock.findByEmail.mockResolvedValue(mockJugador);

    // Intento 1 fallido
    await expect(
      useCase.execute({ identificador: 'sniper@airsoft.cl', password: 'mal1' }),
    ).rejects.toThrow(UnauthorizedException);

    // Intento 2 fallido
    await expect(
      useCase.execute({ identificador: 'sniper@airsoft.cl', password: 'mal2' }),
    ).rejects.toThrow(UnauthorizedException);

    // Intento 3 fallido -> Dispara bloqueo por cooldown de 1 minuto
    try {
      await useCase.execute({ identificador: 'sniper@airsoft.cl', password: 'mal3' });
      throw new Error('Debió fallar con 429');
    } catch (err: any) {
      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(err.getResponse().segundosRestantes).toBe(60);
    }

    // Intento 4 inmediato mientras está en cooldown -> Rechazo inmediato sin consultar DB ni bcrypt
    try {
      await useCase.execute({ identificador: 'sniper@airsoft.cl', password: 'PasswordSegura123!' });
      throw new Error('Debió rechazar por estar en cooldown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it('un login exitoso resetea los intentos fallidos acumulados', async () => {
    const passwordPlana = 'Password123!';
    const hash = await bcrypt.hash(passwordPlana, 10);
    const mockJugador = new Jugador(5, 'Echo', 'echo@airsoft.cl', hash, new Date());
    repoMock.findByEmail.mockResolvedValue(mockJugador);

    // 2 intentos fallidos
    await expect(
      useCase.execute({ identificador: 'echo@airsoft.cl', password: 'error1' }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      useCase.execute({ identificador: 'echo@airsoft.cl', password: 'error2' }),
    ).rejects.toThrow(UnauthorizedException);

    // Intento 3 exitoso
    const res = await useCase.execute({ identificador: 'echo@airsoft.cl', password: passwordPlana });
    expect(res).toBeDefined();

    // Siguiente intento fallido debe comenzar la cuenta de nuevo (no bloquearse de inmediato)
    await expect(
      useCase.execute({ identificador: 'echo@airsoft.cl', password: 'errorNuevo' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
