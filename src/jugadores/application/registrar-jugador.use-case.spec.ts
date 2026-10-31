import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import { RegistrarJugadorUseCase } from './registrar-jugador.use-case';
import { IJugadorRepository } from '../domain/jugador.repository.interface';
import { Jugador } from '../domain/jugador.entity';

describe('RegistrarJugadorUseCase', () => {
  let useCase: RegistrarJugadorUseCase;
  let repoMock: jest.Mocked<IJugadorRepository>;

  beforeEach(() => {
    repoMock = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByAlias: jest.fn(),
      findById: jest.fn(),
    };
    useCase = new RegistrarJugadorUseCase(repoMock);
  });

  it('debe registrar un jugador exitosamente si email y alias no están tomados', async () => {
    repoMock.findByEmail.mockResolvedValue(null);
    repoMock.findByAlias.mockResolvedValue(null);
    repoMock.create.mockResolvedValue(
      new Jugador(1, 'SniperPro', 'sniper@airsoft.cl', 'hashed_pass', new Date()),
    );

    const result = await useCase.execute({
      alias: 'SniperPro',
      email: 'sniper@airsoft.cl',
      password: 'Password123!',
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.alias).toBe('SniperPro');
    expect(repoMock.create).toHaveBeenCalledTimes(1);
  });

  it('debe lanzar ConflictException si el email ya existe', async () => {
    repoMock.findByEmail.mockResolvedValue(
      new Jugador(1, 'OtroAlias', 'sniper@airsoft.cl', 'hashed_pass', new Date()),
    );

    await expect(
      useCase.execute({
        alias: 'SniperPro',
        email: 'sniper@airsoft.cl',
        password: 'Password123!',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('debe lanzar ConflictException si el alias ya existe', async () => {
    repoMock.findByEmail.mockResolvedValue(null);
    repoMock.findByAlias.mockResolvedValue(
      new Jugador(1, 'SniperPro', 'otro@airsoft.cl', 'hashed_pass', new Date()),
    );

    await expect(
      useCase.execute({
        alias: 'SniperPro',
        email: 'nuevo@airsoft.cl',
        password: 'Password123!',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
