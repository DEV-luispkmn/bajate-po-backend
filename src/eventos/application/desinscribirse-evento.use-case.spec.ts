import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DesinscribirseEventoUseCase } from './desinscribirse-evento.use-case';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import { Evento, JugadorEnBando } from '../domain/evento.entity';

describe('DesinscribirseEventoUseCase', () => {
  let useCase: DesinscribirseEventoUseCase;
  let eventoRepoMock: jest.Mocked<IEventoRepository>;

  beforeEach(() => {
    eventoRepoMock = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCodigoInvitacion: jest.fn(),
      findBandoByQrToken: jest.fn(),
      findAll: jest.fn(),
      unirJugadorABando: jest.fn(),
      obtenerJugadoresDeEvento: jest.fn(),
      desinscribirJugador: jest.fn(),
      actualizarEstado: jest.fn(),
      modificar: jest.fn(),
      eliminar: jest.fn(),
      listarEquipos: jest.fn(),
    };

    useCase = new DesinscribirseEventoUseCase(eventoRepoMock);
  });

  it('debe lanzar NotFoundException si el evento no existe', async () => {
    eventoRepoMock.findById.mockResolvedValue(null);

    await expect(useCase.execute(99, 1)).rejects.toThrow(NotFoundException);
  });

  it('debe lanzar BadRequestException si el evento está cancelado o finalizado', async () => {
    eventoRepoMock.findById.mockResolvedValue(
      new Evento(1, 'Operación Fénix', 'PICHANGA', 'ABIERTO', 1, 99, 'FINALIZADO'),
    );

    await expect(useCase.execute(1, 1)).rejects.toThrow(BadRequestException);
  });

  it('debe lanzar BadRequestException si el jugador no está inscrito en el evento', async () => {
    eventoRepoMock.findById.mockResolvedValue(
      new Evento(1, 'Operación Fénix', 'PICHANGA', 'ABIERTO', 1, 99, 'PROGRAMADO'),
    );
    eventoRepoMock.obtenerJugadoresDeEvento.mockResolvedValue([
      new JugadorEnBando(1, 2, 1, 'ASALTO'),
    ]);

    await expect(useCase.execute(1, 1)).rejects.toThrow(BadRequestException);
  });

  it('debe desinscribir al jugador exitosamente', async () => {
    eventoRepoMock.findById.mockResolvedValue(
      new Evento(1, 'Operación Fénix', 'PICHANGA', 'ABIERTO', 1, 99, 'PROGRAMADO'),
    );
    eventoRepoMock.obtenerJugadoresDeEvento.mockResolvedValue([
      new JugadorEnBando(1, 1, 1, 'ASALTO'),
    ]);

    const res = await useCase.execute(1, 1);
    expect(res.mensaje).toContain('Te has bajado exitosamente');
    expect(eventoRepoMock.desinscribirJugador).toHaveBeenCalledWith(1, 1);
  });

  it('debe permitir bajarse al organizador sin arrojar error si no estaba en la lista de combatientes', async () => {
    eventoRepoMock.findById.mockResolvedValue(
      new Evento(1, 'Operación Fénix', 'PICHANGA', 'ABIERTO', 1, 99, 'PROGRAMADO'),
    );
    eventoRepoMock.obtenerJugadoresDeEvento.mockResolvedValue([
      new JugadorEnBando(1, 2, 1, 'ASALTO'),
    ]);

    const res = await useCase.execute(1, 99);
    expect(res.mensaje).toContain('Como comandante organizador');
    expect(eventoRepoMock.desinscribirJugador).not.toHaveBeenCalled();
  });

  it('debe desinscribir al organizador y liberar su cupo si estaba enlistado en un bando', async () => {
    eventoRepoMock.findById.mockResolvedValue(
      new Evento(1, 'Operación Fénix', 'PICHANGA', 'ABIERTO', 1, 99, 'PROGRAMADO'),
    );
    eventoRepoMock.obtenerJugadoresDeEvento.mockResolvedValue([
      new JugadorEnBando(1, 99, 1, 'ASALTO'),
    ]);

    const res = await useCase.execute(1, 99);
    expect(res.mensaje).toContain('Te has bajado exitosamente');
    expect(eventoRepoMock.desinscribirJugador).toHaveBeenCalledWith(1, 99);
  });
});
