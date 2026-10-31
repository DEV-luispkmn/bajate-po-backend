import { Injectable } from '@nestjs/common';
import {
  IEventoRepository,
  CrearEventoData,
  FiltrosListarEventos,
} from '../domain/evento.repository.interface';
import { Evento, Bando, JugadorEnBando, EstadoEvento } from '../domain/evento.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaEventoRepository implements IEventoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CrearEventoData): Promise<Evento> {
    const raw = await this.prisma.evento.create({
      data: {
        titulo: data.titulo,
        tipo: data.tipo,
        privacidad: data.privacidad,
        canchaId: data.canchaId,
        organizadorId: data.organizadorId,
        fechaInicio: data.fechaInicio ?? null,
        codigoInvitacion: data.codigoInvitacion,
        bandos: {
          create: data.bandos.map((b) => ({
            nombre: b.nombre,
            colorHex: b.colorHex ?? null,
            qrToken: b.qrToken,
          })),
        },
      },
      include: {
        bandos: true,
        cancha: true,
        organizador: true,
      },
    });

    return this.mapToDomain(raw);
  }

  async findById(id: number): Promise<Evento | null> {
    const raw = await this.prisma.evento.findUnique({
      where: { id },
      include: {
        bandos: {
          include: {
            _count: {
              select: { jugadores: true },
            },
          },
        },
        cancha: true,
        organizador: true,
      },
    });

    return raw ? this.mapToDomain(raw) : null;
  }

  async findByCodigoInvitacion(codigo: string): Promise<Evento | null> {
    const raw = await this.prisma.evento.findUnique({
      where: { codigoInvitacion: codigo },
      include: {
        bandos: true,
        cancha: true,
        organizador: true,
      },
    });

    return raw ? this.mapToDomain(raw) : null;
  }

  async findBandoByQrToken(qrToken: string): Promise<Bando | null> {
    const raw = await this.prisma.bando.findUnique({
      where: { qrToken },
    });

    if (!raw) return null;

    return new Bando(
      raw.id,
      raw.eventoId,
      raw.nombre,
      raw.colorHex ?? undefined,
      raw.qrToken ?? undefined,
    );
  }

  async findAll(filtros?: FiltrosListarEventos): Promise<Evento[]> {
    const where: any = {};
    if (filtros?.estado) where.estado = filtros.estado;
    if (filtros?.tipo) where.tipo = filtros.tipo;
    if (filtros?.privacidad) where.privacidad = filtros.privacidad;

    const list = await this.prisma.evento.findMany({
      where,
      orderBy: { fechaInicio: 'desc' },
      include: {
        bandos: {
          include: {
            _count: {
              select: { jugadores: true },
            },
          },
        },
        cancha: true,
        organizador: true,
      },
    });

    return list.map((item) => this.mapToDomain(item));
  }

  async unirJugadorABando(
    eventoId: number,
    jugadorId: number,
    bandoId: number,
    rol: string,
  ): Promise<JugadorEnBando> {
    const raw = await this.prisma.jugadorBando.upsert({
      where: {
        eventoId_jugadorId: {
          eventoId,
          jugadorId,
        },
      },
      update: {
        bandoId,
        rol,
      },
      create: {
        eventoId,
        jugadorId,
        bandoId,
        rol,
      },
      include: {
        jugador: true,
      },
    });

    return new JugadorEnBando(
      raw.eventoId,
      raw.jugadorId,
      raw.bandoId,
      raw.rol,
      raw.jugador?.alias,
      raw.jugador?.avatarUrl ?? undefined,
    );
  }

  async obtenerJugadoresDeEvento(eventoId: number): Promise<JugadorEnBando[]> {
    const list = await this.prisma.jugadorBando.findMany({
      where: { eventoId },
      include: {
        jugador: true,
      },
    });

    return list.map(
      (item) =>
        new JugadorEnBando(
          item.eventoId,
          item.jugadorId,
          item.bandoId,
          item.rol,
          item.jugador?.alias,
          item.jugador?.avatarUrl ?? undefined,
        ),
    );
  }

  async actualizarEstado(eventoId: number, nuevoEstado: EstadoEvento): Promise<Evento> {
    const raw = await this.prisma.evento.update({
      where: { id: eventoId },
      data: { estado: nuevoEstado },
      include: {
        bandos: true,
        cancha: true,
        organizador: true,
      },
    });

    return this.mapToDomain(raw);
  }

  private mapToDomain(raw: any): Evento {
    const bandos = raw.bandos?.map(
      (b: any) =>
        new Bando(
          b.id,
          b.eventoId,
          b.nombre,
          b.colorHex ?? undefined,
          b.qrToken ?? undefined,
          b._count?.jugadores,
        ),
    );

    return new Evento(
      raw.id,
      raw.titulo,
      raw.tipo,
      raw.privacidad,
      raw.canchaId,
      raw.organizadorId,
      raw.estado,
      raw.fechaInicio ?? undefined,
      raw.codigoInvitacion ?? undefined,
      bandos,
      raw.cancha?.nombre,
      raw.organizador?.alias,
    );
  }
}
