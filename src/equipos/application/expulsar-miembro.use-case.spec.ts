import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ExpulsarMiembroUseCase } from './expulsar-miembro.use-case';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';
import type { NotificacionesService } from '../../notificaciones/notificaciones.service';

describe('ExpulsarMiembroUseCase', () => {
  let useCase: ExpulsarMiembroUseCase;
  let equipoRepoMock: jest.Mocked<IEquipoRepository>;
  let notificacionesMock: { crear: jest.Mock };

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
      crearPostulacion: jest.fn(),
      listarPostulaciones: jest.fn(),
      buscarPostulacionPorId: jest.fn(),
      actualizarEstadoPostulacion: jest.fn(),
      obtenerPostulacionActiva: jest.fn(),
      listarMisPostulaciones: jest.fn(),
    };

    notificacionesMock = {
      crear: jest.fn<() => Promise<null>>().mockResolvedValue(null),
    };

    useCase = new ExpulsarMiembroUseCase(
      equipoRepoMock,
      notificacionesMock as unknown as NotificacionesService,
    );
  });

  const crearEquipoBase = () =>
    new Equipo({
      id: 1,
      nombre: 'Fuerza Delta',
      tlId: 10,
      fundadorId: 10,
      capitanId: 10,
      createdAt: new Date(),
      totalMiembros: 3,
      postulacionesAbiertas: true,
      miembros: [
        { id: 10, alias: 'Comandante', esCapitan: true, esTL: true, esFundador: true },
        { id: 20, alias: 'Ghost', esCapitan: false, esTL: false, esFundador: false },
        { id: 30, alias: 'Viper', esCapitan: false, esTL: false, esFundador: false },
      ],
    });

  it('debe permitir al TL expulsar a un miembro regular, notificarlo y retornar el equipo actualizado', async () => {
    const equipoInicial = crearEquipoBase();
    const equipoActualizado = new Equipo({
      ...equipoInicial,
      totalMiembros: 2,
      miembros: equipoInicial.miembros?.filter((m) => m.id !== 20),
    });

    equipoRepoMock.obtenerMiEquipo.mockResolvedValue(equipoInicial);
    equipoRepoMock.salirJugador.mockResolvedValue(undefined);
    equipoRepoMock.buscarPorId.mockResolvedValue(equipoActualizado);

    const resultado = await useCase.execute(10, 20);

    expect(equipoRepoMock.salirJugador).toHaveBeenCalledWith(20);
    expect(notificacionesMock.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        jugadorId: 20,
        titulo: 'Baja de Equipo',
        tipo: 'SISTEMA',
      }),
    );
    expect(resultado.totalMiembros).toBe(2);
    expect(resultado.miembros?.some((m) => m.id === 20)).toBe(false);
  });

  it('debe lanzar ForbiddenException si un miembro regular sin permisos intenta expulsar', async () => {
    equipoRepoMock.obtenerMiEquipo.mockResolvedValue(crearEquipoBase());

    await expect(useCase.execute(20, 30)).rejects.toThrow(ForbiddenException);
    expect(equipoRepoMock.salirJugador).not.toHaveBeenCalled();
  });

  it('debe lanzar NotFoundException si el solicitante no pertenece a ningún equipo', async () => {
    equipoRepoMock.obtenerMiEquipo.mockResolvedValue(null);

    await expect(useCase.execute(10, 20)).rejects.toThrow(NotFoundException);
    expect(equipoRepoMock.salirJugador).not.toHaveBeenCalled();
  });

  it('debe lanzar BadRequestException si intenta expulsarse a sí mismo', async () => {
    equipoRepoMock.obtenerMiEquipo.mockResolvedValue(crearEquipoBase());

    await expect(useCase.execute(10, 10)).rejects.toThrow(BadRequestException);
    expect(equipoRepoMock.salirJugador).not.toHaveBeenCalled();
  });

  it('debe lanzar BadRequestException si el fundador intenta expulsar al TL actual', async () => {
    const equipoConOtroTl = new Equipo({
      id: 1,
      nombre: 'Fuerza Delta',
      tlId: 20,
      fundadorId: 10,
      capitanId: 20,
      createdAt: new Date(),
      totalMiembros: 2,
      postulacionesAbiertas: true,
      miembros: [
        { id: 10, alias: 'Fundador', esCapitan: false, esTL: false, esFundador: true },
        { id: 20, alias: 'NuevoTL', esCapitan: true, esTL: true, esFundador: false },
      ],
    });
    equipoRepoMock.obtenerMiEquipo.mockResolvedValue(equipoConOtroTl);

    await expect(useCase.execute(10, 20)).rejects.toThrow(BadRequestException);
    expect(equipoRepoMock.salirJugador).not.toHaveBeenCalled();
  });

  it('debe lanzar BadRequestException si el jugador objetivo no pertenece al equipo', async () => {
    equipoRepoMock.obtenerMiEquipo.mockResolvedValue(crearEquipoBase());

    await expect(useCase.execute(10, 999)).rejects.toThrow(BadRequestException);
    expect(equipoRepoMock.salirJugador).not.toHaveBeenCalled();
  });
});
