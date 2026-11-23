import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DesintegrarEquipoUseCase } from './desintegrar-equipo.use-case';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';

describe('DesintegrarEquipoUseCase', () => {
  let useCase: DesintegrarEquipoUseCase;
  let equipoRepoMock: jest.Mocked<IEquipoRepository>;

  beforeEach(() => {
    equipoRepoMock = {
      crear: jest.fn(),
      modificar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorCodigo: jest.fn(),
      listar: jest.fn(),
      obtenerMiEquipo: jest.fn(),
      unirJugador: jest.fn(),
      salirJugador: jest.fn(),
      desintegrar: jest.fn(),
      cambiarEstadoPostulaciones: jest.fn(),
      asignarTL: jest.fn(),
    };

    useCase = new DesintegrarEquipoUseCase(equipoRepoMock);
  });

  it('debe lanzar NotFoundException si el jugador no pertenece a ningún equipo', async () => {
    equipoRepoMock.obtenerMiEquipo.mockResolvedValue(null);

    await expect(useCase.execute(10)).rejects.toThrow(NotFoundException);
  });

  it('debe lanzar ForbiddenException si el jugador no es TL ni fundador', async () => {
    equipoRepoMock.obtenerMiEquipo.mockResolvedValue(
      new Equipo({
        id: 1,
        nombre: 'Fuerza Delta',
        tlId: 99,
        fundadorId: 99,
        createdAt: new Date().toISOString(),
        totalMiembros: 3,
        postulacionesAbiertas: true,
      }),
    );

    await expect(useCase.execute(10)).rejects.toThrow(ForbiddenException);
  });

  it('debe desintegrar el equipo exitosamente si es el TL', async () => {
    equipoRepoMock.obtenerMiEquipo.mockResolvedValue(
      new Equipo({
        id: 1,
        nombre: 'Fuerza Delta',
        tlId: 10,
        fundadorId: 10,
        createdAt: new Date().toISOString(),
        totalMiembros: 3,
        postulacionesAbiertas: true,
      }),
    );

    const res = await useCase.execute(10);
    expect(res.mensaje).toContain('ha sido desintegrada definitivamente');
    expect(equipoRepoMock.desintegrar).toHaveBeenCalledWith(1);
  });
});
