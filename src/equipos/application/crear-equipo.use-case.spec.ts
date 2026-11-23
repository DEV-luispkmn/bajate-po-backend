import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { CrearEquipoUseCase } from './crear-equipo.use-case';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';

describe('CrearEquipoUseCase', () => {
  let useCase: CrearEquipoUseCase;
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
      cambiarEstadoPostulaciones: jest.fn(),
      asignarTL: jest.fn(),
    };

    useCase = new CrearEquipoUseCase(equipoRepoMock);
  });

  it('debe lanzar BadRequestException si el jugador ya pertenece a un equipo', async () => {
    equipoRepoMock.obtenerMiEquipo.mockResolvedValue(
      new Equipo({
        id: 1,
        nombre: 'Fuerza Delta',
        createdAt: new Date().toISOString(),
        totalMiembros: 5,
        postulacionesAbiertas: true,
      }),
    );

    await expect(
      useCase.execute(
        {
          nombre: 'Comando Cóndor',
          region: 'Región Metropolitana',
        },
        10,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe crear un equipo exitosamente si el jugador no tiene equipo', async () => {
    equipoRepoMock.obtenerMiEquipo.mockResolvedValue(null);
    equipoRepoMock.crear.mockImplementation(async (data, creadorId) => {
      return new Equipo({
        id: 99,
        nombre: data.nombre!,
        region: data.region,
        fundadorId: creadorId,
        tlId: creadorId,
        codigoAcceso: data.codigoAcceso,
        createdAt: new Date().toISOString(),
        totalMiembros: 1,
        postulacionesAbiertas: true,
      });
    });

    const resultado = await useCase.execute(
      {
        nombre: 'Comando Cóndor',
        region: 'Región Metropolitana',
      },
      10,
    );

    expect(resultado).toBeDefined();
    expect(resultado.id).toBe(99);
    expect(resultado.nombre).toBe('Comando Cóndor');
    expect(resultado.tlId).toBe(10);
    expect(resultado.fundadorId).toBe(10);
    expect(resultado.codigoAcceso).toHaveLength(6);
  });

  it('debe lanzar BadRequestException si el jugadorId es inválido o no existe', async () => {
    await expect(
      useCase.execute(
        {
          nombre: 'Comando Cóndor',
        },
        0 as any,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
