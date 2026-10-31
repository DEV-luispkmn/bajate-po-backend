import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { CrearEventoUseCase } from './crear-evento.use-case';
import { IEventoRepository } from '../domain/evento.repository.interface';
import { ICanchaRepository } from '../../canchas/domain/cancha.repository.interface';
import { Cancha } from '../../canchas/domain/cancha.entity';
import { Evento, Bando } from '../domain/evento.entity';
import { TipoEventoDto, PrivacidadDto } from './crear-evento.dto';

describe('CrearEventoUseCase', () => {
  let useCase: CrearEventoUseCase;
  let eventoRepoMock: jest.Mocked<IEventoRepository>;
  let canchaRepoMock: jest.Mocked<ICanchaRepository>;

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

    canchaRepoMock = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    useCase = new CrearEventoUseCase(eventoRepoMock, canchaRepoMock);
  });

  it('debe crear un evento con bandos por defecto si no se especifican', async () => {
    canchaRepoMock.findById.mockResolvedValue(new Cancha(1, 'Campo Quillayes', -33.4, -70.6));
    eventoRepoMock.create.mockImplementation(async (data) => {
      const bandos = data.bandos.map((b, i) => new Bando(i + 1, 10, b.nombre, b.colorHex, b.qrToken));
      return new Evento(
        10,
        data.titulo,
        data.tipo,
        data.privacidad,
        data.canchaId,
        data.organizadorId,
        'PROGRAMADO',
        data.fechaInicio,
        data.codigoInvitacion,
        bandos,
      );
    });

    const resultado = await useCase.execute(
      {
        titulo: 'Operación Cóndor',
        tipo: TipoEventoDto.PICHANGA,
        privacidad: PrivacidadDto.ABIERTO,
        canchaId: 1,
      },
      99, // organizadorId
    );

    expect(resultado).toBeDefined();
    expect(resultado.id).toBe(10);
    expect(resultado.titulo).toBe('Operación Cóndor');
    expect(resultado.codigoInvitacion).toMatch(/^BP-[0-9A-F]{6}$/);
    expect(resultado.bandos).toHaveLength(2);
    expect(resultado.bandos?.[0].qrToken).toContain('bando_');
  });

  it('debe lanzar NotFoundException si la cancha no existe', async () => {
    canchaRepoMock.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(
        {
          titulo: 'Torneo Invierno',
          tipo: TipoEventoDto.TORNEO,
          privacidad: PrivacidadDto.CERRADO,
          canchaId: 999,
        },
        1,
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
