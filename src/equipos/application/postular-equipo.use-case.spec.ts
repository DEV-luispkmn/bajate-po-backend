import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PostularEquipoUseCase } from './postular-equipo.use-case';
import { IEquipoRepository } from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';
import { PostulacionEquipo } from '../domain/postulacion.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PostularEquipoUseCase', () => {
  let useCase: PostularEquipoUseCase;
  let mockRepo: jest.Mocked<IEquipoRepository>;

  const equipoMock = new Equipo({
    id: 10,
    nombre: 'Delta Force',
    activo: true,
    postulacionesAbiertas: true,
  });

  beforeEach(() => {
    mockRepo = {
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
      crearPostulacion: jest.fn(),
      listarPostulaciones: jest.fn(),
      buscarPostulacionPorId: jest.fn(),
      actualizarEstadoPostulacion: jest.fn(),
      obtenerPostulacionActiva: jest.fn(),
      listarMisPostulaciones: jest.fn(),
    } as unknown as jest.Mocked<IEquipoRepository>;

    useCase = new PostularEquipoUseCase(mockRepo);
  });

  it('permite enviar una postulación si las postulaciones están abiertas', async () => {
    mockRepo.buscarPorId.mockResolvedValue(equipoMock);
    mockRepo.obtenerMiEquipo.mockResolvedValue(null);
    mockRepo.obtenerPostulacionActiva.mockResolvedValue(null);
    mockRepo.crearPostulacion.mockResolvedValue(
      new PostulacionEquipo({
        id: 1,
        equipoId: 10,
        jugadorId: 5,
        contacto: '+56912345678',
        mensaje: 'Quiero unirme como tirador selecto',
        estado: 'PENDIENTE',
      }),
    );

    const res = await useCase.execute(5, 10, {
      contacto: '+56912345678',
      mensaje: 'Quiero unirme como tirador selecto',
    });

    expect(mockRepo.crearPostulacion).toHaveBeenCalledWith(10, 5, {
      contacto: '+56912345678',
      mensaje: 'Quiero unirme como tirador selecto',
    });
    expect(res.estado).toBe('PENDIENTE');
  });

  it('rechaza si las postulaciones del equipo están cerradas', async () => {
    mockRepo.buscarPorId.mockResolvedValue(
      new Equipo({ id: 10, nombre: 'Delta Force', activo: true, postulacionesAbiertas: false }),
    );

    await expect(useCase.execute(5, 10, {})).rejects.toThrow(BadRequestException);
  });

  it('rechaza si ya tiene una postulación pendiente', async () => {
    mockRepo.buscarPorId.mockResolvedValue(equipoMock);
    mockRepo.obtenerMiEquipo.mockResolvedValue(null);
    mockRepo.obtenerPostulacionActiva.mockResolvedValue(
      new PostulacionEquipo({ id: 1, equipoId: 10, jugadorId: 5, estado: 'PENDIENTE' }),
    );

    await expect(useCase.execute(5, 10, {})).rejects.toThrow(BadRequestException);
  });
});
