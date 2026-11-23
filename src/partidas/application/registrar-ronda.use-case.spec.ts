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
      findByIdConBandos: jest.fn(),
      findByEventoId: jest.fn(),
      actualizarEstado: jest.fn(),
      registrarRonda: jest.fn(),
      sincronizarRondas: jest.fn(),
      obtenerRondasDePartida: jest.fn(),
      obtenerJugadoresDePartida: jest.fn(),
      asignarJugadorAPartida: jest.fn(),
      obtenerMvpsDePartida: jest.fn(),
      registrarVotoMvp: jest.fn(),
      haVotadoMvp: jest.fn(),
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
      repoMock.findByIdConBandos.mockResolvedValue({
        partida: new Partida(1, 10, 'EN_CURSO', 'Ronda 1-4'),
        bandos: [
          { id: 1, nombre: 'Bando Alfa' },
          { id: 2, nombre: 'Bando Bravo' },
        ],
        organizadorId: 1,
        tituloEvento: 'Evento Test',
      });
      repoMock.obtenerJugadoresDePartida.mockResolvedValue([
        { jugadorId: 10, alias: 'Soldado 1', bandoId: 1, rol: 'ASALTO' },
        { jugadorId: 11, alias: 'Soldado 2', bandoId: 2, rol: 'ASALTO' },
      ]);
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

    it('debe rechazar registrar ronda si algún bando no tiene jugadores', async () => {
      repoMock.findByIdConBandos.mockResolvedValue({
        partida: new Partida(1, 10, 'EN_CURSO', 'Ronda 1-4'),
        bandos: [
          { id: 1, nombre: 'Bando Alfa' },
          { id: 2, nombre: 'Bando Bravo' },
        ],
        organizadorId: 1,
        tituloEvento: 'Evento Test',
      });
      // Solo el bando 1 tiene jugadores
      repoMock.obtenerJugadoresDePartida.mockResolvedValue([
        { jugadorId: 10, alias: 'Soldado 1', bandoId: 1, rol: 'ASALTO' },
      ]);

      await expect(
        registrarUseCase.execute(1, { numeroRonda: 1, bandoGanadorId: 1 }),
      ).rejects.toThrow('No se pueden asignar puntajes a la partida: el bando "Bando Bravo" no tiene jugadores');
    });

    it('debe lanzar NotFoundException si la partida no existe', async () => {
      repoMock.findByIdConBandos.mockResolvedValue(null);

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
