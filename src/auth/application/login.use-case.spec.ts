import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import { IJugadorRepository } from '../../jugadores/domain/jugador.repository.interface';
import { JwtService } from '@nestjs/jwt';
import { Jugador } from '../../jugadores/domain/jugador.entity';
import * as bcrypt from 'bcrypt';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let repoMock: jest.Mocked<IJugadorRepository>;
  let jwtMock: jest.Mocked<JwtService>;

  beforeEach(() => {
    repoMock = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByAlias: jest.fn(),
      findById: jest.fn(),
    };
    jwtMock = {
      signAsync: jest.fn().mockResolvedValue('jwt_token_simulado'),
    } as any;

    useCase = new LoginUseCase(repoMock, jwtMock);
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
});
