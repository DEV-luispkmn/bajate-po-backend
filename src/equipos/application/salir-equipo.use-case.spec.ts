import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { SalirEquipoUseCase } from './salir-equipo.use-case';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';

describe('SalirEquipoUseCase', () => {
  let useCase: SalirEquipoUseCase;
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

    useCase = new SalirEquipoUseCase(equipoRepoMock);
  });

  it('debe lanzar BadRequestException si el TL intenta abandonar teniendo otros miembros activos', async () => {
    equipoRepoMock.obtenerMiEquipo.mockResolvedValue(
      new Equipo({
        id: 1,
        nombre: 'Fuerza Delta',
        tlId: 10,
        fundadorId: 10,
        createdAt: new Date().toISOString(),
        totalMiembros: 4,
        postulacionesAbiertas: true,
      }),
    );

    await expect(useCase.execute(10)).rejects.toThrow(BadRequestException);
  });

  it('debe desintegrar la escuadra si el TL es el único miembro', async () => {
    equipoRepoMock.obtenerMiEquipo.mockResolvedValue(
      new Equipo({
        id: 1,
        nombre: 'Fuerza Delta',
        tlId: 10,
        fundadorId: 10,
        createdAt: new Date().toISOString(),
        totalMiembros: 1,
        postulacionesAbiertas: true,
      }),
    );

    const res = await useCase.execute(10);
    expect(res.mensaje).toContain('desintegrado');
    expect(equipoRepoMock.desintegrar).toHaveBeenCalledWith(1);
  });

  it('debe permitir salir a un miembro regular', async () => {
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

    const res = await useCase.execute(10);
    expect(res.mensaje).toContain('Te has desvinculado exitosamente');
    expect(equipoRepoMock.salirJugador).toHaveBeenCalledWith(10);
  });
});
