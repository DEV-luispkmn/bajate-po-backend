import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EvaluarFamaUseCase } from './evaluar-fama.use-case';
import { BadRequestException } from '@nestjs/common';

describe('EvaluarFamaUseCase', () => {
  let useCase: EvaluarFamaUseCase;
  let mockPartidaRepo: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockPartidaRepo = {
      findById: jest.fn().mockResolvedValue({ id: 10, eventoId: 100 }),
      obtenerJugadoresDePartida: jest.fn().mockResolvedValue([
        { jugadorId: 1, alias: 'Operador 1', bandoId: 1, rol: 'ASALTO' },
        { jugadorId: 2, alias: 'Operador 2', bandoId: 1, rol: 'CQB' },    // Aliado
        { jugadorId: 3, alias: 'Operador 3', bandoId: 2, rol: 'SNIPER' }, // Enemigo
      ]),
    };

    mockPrisma = {
      evaluacionFama: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
      jugador: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === 1) return Promise.resolve({ id: 1, equipoId: 50 });
          if (where.id === 2) return Promise.resolve({ id: 2, equipoId: 50, fama: 0.0 }); // Mismo equipo
          if (where.id === 3) return Promise.resolve({ id: 3, equipoId: 99, fama: 0.0 }); // Distinto equipo
          return Promise.resolve(null);
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
    };

    useCase = new EvaluarFamaUseCase(mockPartidaRepo, mockPrisma);
  });

  it('no permite auto-evaluarse', async () => {
    await expect(
      useCase.execute(10, 1, {
        evaluadoId: 1,
        tipo: 'RECONOCIMIENTO',
        categoria: 'HONESTO',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('calcula fama de reconocimiento a enemigo de distinto equipo (+0.07)', async () => {
    const res = await useCase.execute(10, 1, {
      evaluadoId: 3,
      tipo: 'RECONOCIMIENTO',
      categoria: 'HONESTO',
    });

    expect(res.esAliado).toBe(false);
    expect(res.mismoEquipo).toBe(false);
    expect(res.deltaFama).toBe(0.07);
    expect(res.nuevaFama).toBe(0.07);
  });

  it('calcula fama de reporte a enemigo de distinto equipo (-0.07)', async () => {
    const res = await useCase.execute(10, 1, {
      evaluadoId: 3,
      tipo: 'REPORTE',
      categoria: 'INMORTAL',
    });

    expect(res.esAliado).toBe(false);
    expect(res.mismoEquipo).toBe(false);
    expect(res.deltaFama).toBe(-0.07);
    expect(res.nuevaFama).toBe(-0.07);
  });

  it('aplica nerfeo de 0.03 para miembros del mismo equipo (0.05 - 0.03 = +0.02)', async () => {
    const res = await useCase.execute(10, 1, {
      evaluadoId: 2,
      tipo: 'RECONOCIMIENTO',
      categoria: 'BUEN_COMPANERO',
    });

    expect(res.esAliado).toBe(true);
    expect(res.mismoEquipo).toBe(true);
    expect(res.deltaFama).toBe(0.02);
    expect(res.nuevaFama).toBe(0.02);
  });

  it('aplica nerfeo de 0.03 para reportes de miembros del mismo equipo (-0.02)', async () => {
    const res = await useCase.execute(10, 1, {
      evaluadoId: 2,
      tipo: 'REPORTE',
      categoria: 'MAL_COMPANERO',
    });

    expect(res.esAliado).toBe(true);
    expect(res.mismoEquipo).toBe(true);
    expect(res.deltaFama).toBe(-0.02);
    expect(res.nuevaFama).toBe(-0.02);
  });
});
