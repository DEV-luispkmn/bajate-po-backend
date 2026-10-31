import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UnirseEventoUseCase } from './unirse-evento.use-case';
import { IEventoRepository } from '../domain/evento.repository.interface';
import { Bando, Evento, JugadorEnBando } from '../domain/evento.entity';

describe('UnirseEventoUseCase', () => {
  let useCase: UnirseEventoUseCase;
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
      actualizarEstado: jest.fn(),
    };

    useCase = new UnirseEventoUseCase(eventoRepoMock);
  });

  it('debe unirse a un bando escaneando el código QR directamente en la cancha', async () => {
    const mockBando = new Bando(5, 12, 'Bando Alfa', '#FF0000', 'bando_qr_123');
    eventoRepoMock.findBandoByQrToken.mockResolvedValue(mockBando);
    eventoRepoMock.unirJugadorABando.mockResolvedValue(
      new JugadorEnBando(12, 44, 5, 'SNIPER', 'SniperPro'),
    );

    const resultado = await useCase.execute(
      {
        qrToken: 'bando_qr_123',
        rol: 'SNIPER',
      },
      44, // jugadorId
    );

    expect(resultado).toBeDefined();
    expect(resultado.eventoId).toBe(12);
    expect(resultado.bandoId).toBe(5);
    expect(resultado.rol).toBe('SNIPER');
    expect(eventoRepoMock.unirJugadorABando).toHaveBeenCalledWith(12, 44, 5, 'SNIPER');
  });

  it('debe lanzar NotFoundException si el token QR no existe', async () => {
    eventoRepoMock.findBandoByQrToken.mockResolvedValue(null);

    await expect(
      useCase.execute({ qrToken: 'qr_invalido' }, 44),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe unirse mediante código de invitación y selección de bando', async () => {
    const mockEvento = new Evento(
      20,
      'Versus Santiago',
      'VERSUS',
      'ABIERTO',
      1,
      10,
      'PROGRAMADO',
      new Date(),
      'BP-A1B2C3',
      [
        new Bando(1, 20, 'Bando Rojo'),
        new Bando(2, 20, 'Bando Azul'),
      ],
    );

    eventoRepoMock.findByCodigoInvitacion.mockResolvedValue(mockEvento);
    eventoRepoMock.unirJugadorABando.mockResolvedValue(
      new JugadorEnBando(20, 88, 2, 'ASALTO', 'DeltaForce'),
    );

    const resultado = await useCase.execute(
      {
        codigoInvitacion: 'BP-A1B2C3',
        bandoId: 2,
      },
      88,
    );

    expect(resultado).toBeDefined();
    expect(resultado.bandoId).toBe(2);
    expect(eventoRepoMock.unirJugadorABando).toHaveBeenCalledWith(20, 88, 2, 'ASALTO');
  });

  it('debe lanzar BadRequestException si el bando no pertenece al evento', async () => {
    const mockEvento = new Evento(
      20,
      'Versus Santiago',
      'VERSUS',
      'ABIERTO',
      1,
      10,
      'PROGRAMADO',
      new Date(),
      'BP-A1B2C3',
      [new Bando(1, 20, 'Bando Rojo')],
    );

    eventoRepoMock.findByCodigoInvitacion.mockResolvedValue(mockEvento);

    await expect(
      useCase.execute(
        {
          codigoInvitacion: 'BP-A1B2C3',
          bandoId: 999, // no existe en este evento
        },
        88,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
