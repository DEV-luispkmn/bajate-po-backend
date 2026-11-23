import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ResponderPostulacionUseCase } from './responder-postulacion.use-case';
import { IEquipoRepository } from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';
import { PostulacionEquipo } from '../domain/postulacion.entity';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('ResponderPostulacionUseCase', () => {
  let useCase: ResponderPostulacionUseCase;
  let mockRepo: jest.Mocked<IEquipoRepository>;

  const miEquipoTL = new Equipo({
    id: 10,
    nombre: 'Delta Force',
    tlId: 1, // jugador 1 es TL
    activo: true,
  });

  const postulacionMock = new PostulacionEquipo({
    id: 100,
    equipoId: 10,
    jugadorId: 99,
    estado: 'PENDIENTE',
    contacto: '+56999999999',
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

    useCase = new ResponderPostulacionUseCase(mockRepo);
  });

  it('permite al TL aceptar un postulante y unirlo a la escuadra', async () => {
    mockRepo.obtenerMiEquipo.mockResolvedValueOnce(miEquipoTL).mockResolvedValueOnce(null);
    mockRepo.buscarPostulacionPorId.mockResolvedValue(postulacionMock);
    mockRepo.actualizarEstadoPostulacion.mockResolvedValue(
      new PostulacionEquipo({ ...postulacionMock, estado: 'ACEPTADA' }),
    );

    const res = await useCase.execute(1, 100, 'ACEPTAR');

    expect(mockRepo.unirJugador).toHaveBeenCalledWith(10, 99);
    expect(mockRepo.actualizarEstadoPostulacion).toHaveBeenCalledWith(100, 'ACEPTADA');
    expect(res.estado).toBe('ACEPTADA');
  });

  it('permite al TL rechazar un postulante', async () => {
    mockRepo.obtenerMiEquipo.mockResolvedValue(miEquipoTL);
    mockRepo.buscarPostulacionPorId.mockResolvedValue(postulacionMock);
    mockRepo.actualizarEstadoPostulacion.mockResolvedValue(
      new PostulacionEquipo({ ...postulacionMock, estado: 'RECHAZADA' }),
    );

    const res = await useCase.execute(1, 100, 'RECHAZAR');

    expect(mockRepo.unirJugador).not.toHaveBeenCalled();
    expect(mockRepo.actualizarEstadoPostulacion).toHaveBeenCalledWith(100, 'RECHAZADA');
    expect(res.estado).toBe('RECHAZADA');
  });

  it('permite al TL rechazar un postulante indicando un motivo', async () => {
    mockRepo.obtenerMiEquipo.mockResolvedValue(miEquipoTL);
    mockRepo.buscarPostulacionPorId.mockResolvedValue(postulacionMock);
    mockRepo.actualizarEstadoPostulacion.mockResolvedValue(
      new PostulacionEquipo({ ...postulacionMock, estado: 'RECHAZADA', motivoRechazo: 'Escuadra completa' }),
    );

    const res = await useCase.execute(1, 100, 'RECHAZAR', 'Escuadra completa');

    expect(mockRepo.unirJugador).not.toHaveBeenCalled();
    expect(mockRepo.actualizarEstadoPostulacion).toHaveBeenCalledWith(100, 'RECHAZADA', 'Escuadra completa');
    expect(res.estado).toBe('RECHAZADA');
  });

  it('bloquea si el usuario no es el TL o fundador del equipo', async () => {
    mockRepo.obtenerMiEquipo.mockResolvedValue(
      new Equipo({ id: 10, nombre: 'Delta Force', tlId: 2 }), // El TL es el jugador 2, no el 3
    );

    await expect(useCase.execute(3, 100, 'ACEPTAR')).rejects.toThrow(ForbiddenException);
  });
});
