import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { RegistrarRondaUseCase } from './registrar-ronda.use-case';
import { SincronizarRondasUseCase } from './sincronizar-rondas.use-case';
import { IPartidaRepository } from '../domain/partida.repository.interface';
import { IPartidaNotificationService } from './partida-notification.interface';
import { Partida, Ronda } from '../domain/partida.entity';

describe('Partidas y Rondas UseCases', () => {
  let registrarUseCase: RegistrarRondaUseCase;
  let sincronizarUseCase: SincronizarRondasUseCase;
  let repoMock: jest.Mocked<IPartidaRepository>;
  let notificationMock: jest.Mocked<IPartidaNotificationService>;

  beforeEach(() => {
    repoMock = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEventoId: jest.fn(),
      actualizarEstado: jest.fn(),
      registrarRonda: jest.fn(),
      sincronizarRondas: jest.fn(),
      obtenerRondasDePartida: jest.fn(),
    };

    notificationMock = {
      notificarRondaRegistrada: jest.fn(),
      notificarRondasSincronizadas: jest.fn(),
      notificarEstadoCambiado: jest.fn(),
    };

    registrarUseCase = new RegistrarRondaUseCase(repoMock, notificationMock);
    sincronizarUseCase = new SincronizarRondasUseCase(repoMock, notificationMock);
  });

  describe('RegistrarRondaUseCase', () => {
    it('debe registrar una ronda en la partida y emitir evento por WebSockets', async () => {
      repoMock.findById.mockResolvedValue(new Partida(1, 10, 'EN_CURSO', 'Ronda 1-4'));
      const mockRonda = new Ronda(1, 1, 1, 2, 'SINCRONIZADO', new Date(), 'Bando Bravo');
      repoMock.registrarRonda.mockResolvedValue(mockRonda);
      repoMock.obtenerRondasDePartida.mockResolvedValue([mockRonda]);

      const resultado = await registrarUseCase.execute(1, {
        numeroRonda: 1,
        bandoGanadorId: 2,
      });

      expect(resultado).toBeDefined();
      expect(resultado.numeroRonda).toBe(1);
      expect(resultado.bandoGanadorId).toBe(2);
      expect(repoMock.registrarRonda).toHaveBeenCalledTimes(1);
      expect(notificationMock.notificarRondaRegistrada).toHaveBeenCalledWith(
        1,
        mockRonda,
        { 2: 1 }, // Marcador actualizado (Bando 2 -> 1 ronda)
      );
    });

    it('debe lanzar NotFoundException si la partida no existe', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(
        registrarUseCase.execute(999, { numeroRonda: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('SincronizarRondasUseCase (Offline-First)', () => {
    it('debe sincronizar masivamente rondas y emitir por WebSockets el lote y nuevo marcador', async () => {
      repoMock.findById.mockResolvedValue(new Partida(2, 10, 'EN_CURSO', 'Torneo Match'));
      const rondasSincronizadas = [
        new Ronda(1, 2, 1, 3, 'SINCRONIZADO', new Date('2026-10-31T10:00:00Z')),
        new Ronda(2, 2, 2, 4, 'SINCRONIZADO', new Date('2026-10-31T10:30:00Z')),
      ];
      repoMock.sincronizarRondas.mockResolvedValue(rondasSincronizadas);
      repoMock.obtenerRondasDePartida.mockResolvedValue(rondasSincronizadas);

      const resultado = await sincronizarUseCase.execute(2, {
        rondas: [
          { numeroRonda: 1, bandoGanadorId: 3, fechaRegistro: '2026-10-31T10:00:00Z' },
          { numeroRonda: 2, bandoGanadorId: 4, fechaRegistro: '2026-10-31T10:30:00Z' },
        ],
      });

      expect(resultado).toHaveLength(2);
      expect(repoMock.sincronizarRondas).toHaveBeenCalledTimes(1);
      expect(notificationMock.notificarRondasSincronizadas).toHaveBeenCalledWith(
        2,
        rondasSincronizadas,
        { 3: 1, 4: 1 }, // Marcador consolidado
      );
    });
  });
});
