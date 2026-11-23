import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CrearPartidaUseCase } from './crear-partida.use-case';
import { IPartidaRepository } from '../domain/partida.repository.interface';
import { IEventoRepository } from '../../eventos/domain/evento.repository.interface';
import { Evento, Bando } from '../../eventos/domain/evento.entity';
import { Partida } from '../domain/partida.entity';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('CrearPartidaUseCase - Quórum', () => {
  let useCase: CrearPartidaUseCase;
  let mockPartidaRepo: jest.Mocked<IPartidaRepository>;
  let mockEventoRepo: jest.Mocked<IEventoRepository>;

  beforeEach(() => {
    mockPartidaRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEventoId: jest.fn(),
      registrarRonda: jest.fn(),
      finalizarPartida: jest.fn(),
    } as unknown as jest.Mocked<IPartidaRepository>;

    mockEventoRepo = {
      findById: jest.fn(),
      actualizarEstado: jest.fn(),
    } as unknown as jest.Mocked<IEventoRepository>;

    useCase = new CrearPartidaUseCase(mockPartidaRepo, mockEventoRepo);
  });

  it('rechaza inicio si hay menos de 2 jugadores inscritos en total', async () => {
    const evento = new Evento(
      1,
      'Operación Escorpión',
      'PICHANGA',
      'ABIERTO',
      10,
      1, // organizadorId
      'PROGRAMADO',
      'Desc',
      new Date(),
      new Date(),
      'Región Metropolitana',
      'Santiago',
      undefined,
      undefined,
      'ESC-01',
      [],
      'Cancha 1',
      'Organizador',
      [{ jugadorId: 1, rol: 'ASALTO' }], // Solo 1 jugador
    );

    mockEventoRepo.findById.mockResolvedValue(evento);

    await expect(
      useCase.execute({ eventoId: 1, nombre: 'Ronda 1' }, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza en VERSUS si uno de los bandos está vacío', async () => {
    const bandos = [
      new Bando(101, 1, 'Equipo Alfa'),
      new Bando(102, 1, 'Equipo Bravo'),
    ];
    const evento = new Evento(
      1,
      'Duelo Versus',
      'VERSUS',
      'ABIERTO',
      10,
      1, // organizadorId
      'PROGRAMADO',
      'Desc',
      new Date(),
      new Date(),
      'Región Metropolitana',
      'Santiago',
      undefined,
      undefined,
      'VS-01',
      bandos,
      'Cancha 1',
      'Organizador',
      [
        { jugadorId: 1, bandoId: 101, rol: 'ASALTO' },
        { jugadorId: 2, bandoId: 101, rol: 'MEDICO' }, // Ambos en el mismo bando 101, bando 102 vacío!
      ],
    );

    mockEventoRepo.findById.mockResolvedValue(evento);

    await expect(
      useCase.execute({ eventoId: 1, nombre: 'Ronda 1' }, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('permite iniciar si hay al menos 1 jugador en cada bando en un VERSUS', async () => {
    const bandos = [
      new Bando(101, 1, 'Equipo Alfa'),
      new Bando(102, 1, 'Equipo Bravo'),
    ];
    const evento = new Evento(
      1,
      'Duelo Versus',
      'VERSUS',
      'ABIERTO',
      10,
      1, // organizadorId
      'PROGRAMADO',
      'Desc',
      new Date(),
      new Date(),
      'Región Metropolitana',
      'Santiago',
      undefined,
      undefined,
      'VS-01',
      bandos,
      'Cancha 1',
      'Organizador',
      [
        { jugadorId: 1, bandoId: 101, rol: 'ASALTO' },
        { jugadorId: 2, bandoId: 102, rol: 'ASALTO' }, // 1 en cada bando
      ],
    );

    mockEventoRepo.findById.mockResolvedValue(evento);
    mockPartidaRepo.create.mockResolvedValue(
      new Partida(50, 1, 'Ronda 1', new Date(), 'EN_CURSO'),
    );

    const partida = await useCase.execute({ eventoId: 1, nombre: 'Ronda 1' }, 1);

    expect(partida.id).toBe(50);
    expect(mockEventoRepo.actualizarEstado).toHaveBeenCalledWith(1, 'EN_CURSO');
  });
});
