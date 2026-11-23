import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ModificarEquipoUseCase } from './modificar-equipo.use-case';
import { IEquipoRepository } from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('ModificarEquipoUseCase', () => {
  let useCase: ModificarEquipoUseCase;
  let mockRepo: jest.Mocked<IEquipoRepository>;

  const equipoMock = new Equipo({
    id: 10,
    nombre: 'Alpha Squad',
    activo: true,
    codigoAcceso: 'ALPHA-01',
    createdAt: new Date(),
    lema: 'Por la gloria',
    descripcion: 'Descripcion del escuadron',
    logoUrl: 'http://logo.png',
    region: 'Región Metropolitana',
    ciudad: 'Santiago',
    capitanId: 1,
    fundadorId: 1,
    tlId: 1,
    totalMiembros: 5,
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
    } as unknown as jest.Mocked<IEquipoRepository>;

    useCase = new ModificarEquipoUseCase(mockRepo);
  });

  it('permite modificar al Team Leader (TL)', async () => {
    mockRepo.obtenerMiEquipo.mockResolvedValue(equipoMock);
    mockRepo.modificar.mockResolvedValue({
      ...equipoMock,
      nombre: 'Alpha Squad Updated',
      lema: 'Nuevo lema',
    } as Equipo);

    const res = await useCase.execute(1, {
      nombre: 'Alpha Squad Updated',
      lema: 'Nuevo lema',
    });

    expect(mockRepo.modificar).toHaveBeenCalledWith(10, expect.objectContaining({
      nombre: 'Alpha Squad Updated',
      lema: 'Nuevo lema',
    }));
    expect(res.nombre).toBe('Alpha Squad Updated');
  });

  it('rechaza si el operador no pertenece a un equipo', async () => {
    mockRepo.obtenerMiEquipo.mockResolvedValue(null);

    await expect(useCase.execute(99, { nombre: 'Intento' })).rejects.toThrow(NotFoundException);
  });

  it('rechaza si el operador no es TL ni fundador', async () => {
    mockRepo.obtenerMiEquipo.mockResolvedValue(equipoMock);

    await expect(useCase.execute(2, { nombre: 'Intento' })).rejects.toThrow(ForbiddenException);
  });

  it('rechaza si el nombre está en blanco', async () => {
    mockRepo.obtenerMiEquipo.mockResolvedValue(equipoMock);

    await expect(useCase.execute(1, { nombre: '   ' })).rejects.toThrow(BadRequestException);
  });
});
