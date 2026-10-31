import { Injectable } from '@nestjs/common';
import {
  IPartidaRepository,
  CrearPartidaData,
  RegistrarRondaData,
} from '../domain/partida.repository.interface';
import { Partida, Ronda, EstadoPartida } from '../domain/partida.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaPartidaRepository implements IPartidaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CrearPartidaData): Promise<Partida> {
    const raw = await this.prisma.partida.create({
      data: {
        eventoId: data.eventoId,
        nombre: data.nombre ?? null,
      },
      include: {
        rondas: {
          include: { bandoGanador: true },
        },
      },
    });

    return this.mapToDomain(raw);
  }

  async findById(id: number): Promise<Partida | null> {
    const raw = await this.prisma.partida.findUnique({
      where: { id },
      include: {
        rondas: {
          include: { bandoGanador: true },
          orderBy: { numeroRonda: 'asc' },
        },
      },
    });

    return raw ? this.mapToDomain(raw) : null;
  }

  async findByEventoId(eventoId: number): Promise<Partida[]> {
    const list = await this.prisma.partida.findMany({
      where: { eventoId },
      include: {
        rondas: {
          include: { bandoGanador: true },
          orderBy: { numeroRonda: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    return list.map((item) => this.mapToDomain(item));
  }

  async actualizarEstado(partidaId: number, estado: EstadoPartida): Promise<Partida> {
    const raw = await this.prisma.partida.update({
      where: { id: partidaId },
      data: { estado },
      include: {
        rondas: {
          include: { bandoGanador: true },
          orderBy: { numeroRonda: 'asc' },
        },
      },
    });

    return this.mapToDomain(raw);
  }

  async registrarRonda(data: RegistrarRondaData): Promise<Ronda> {
    const raw = await this.prisma.ronda.create({
      data: {
        partidaId: data.partidaId,
        numeroRonda: data.numeroRonda,
        bandoGanadorId: data.bandoGanadorId ?? null,
        estadoSync: 'SINCRONIZADO',
        fechaRegistro: data.fechaRegistro ?? new Date(),
      },
      include: {
        bandoGanador: true,
      },
    });

    return this.mapRondaToDomain(raw);
  }

  async sincronizarRondas(rondas: RegistrarRondaData[]): Promise<Ronda[]> {
    const resultados: Ronda[] = [];

    // Usamos transacción de Prisma para atomicidad en la sincronización masiva offline
    await this.prisma.$transaction(async (tx) => {
      for (const r of rondas) {
        const raw = await tx.ronda.create({
          data: {
            partidaId: r.partidaId,
            numeroRonda: r.numeroRonda,
            bandoGanadorId: r.bandoGanadorId ?? null,
            estadoSync: 'SINCRONIZADO',
            fechaRegistro: r.fechaRegistro ?? new Date(),
          },
          include: {
            bandoGanador: true,
          },
        });
        resultados.push(this.mapRondaToDomain(raw));
      }
    });

    return resultados;
  }

  async obtenerRondasDePartida(partidaId: number): Promise<Ronda[]> {
    const list = await this.prisma.ronda.findMany({
      where: { partidaId },
      include: { bandoGanador: true },
      orderBy: { numeroRonda: 'asc' },
    });

    return list.map((r) => this.mapRondaToDomain(r));
  }

  private mapRondaToDomain(raw: any): Ronda {
    return new Ronda(
      raw.id,
      raw.partidaId,
      raw.numeroRonda,
      raw.bandoGanadorId ?? undefined,
      raw.estadoSync,
      raw.fechaRegistro,
      raw.bandoGanador?.nombre,
    );
  }

  private mapToDomain(raw: any): Partida {
    const rondas = raw.rondas ? raw.rondas.map((r: any) => this.mapRondaToDomain(r)) : [];

    const marcador: Record<number, number> = {};
    for (const r of rondas) {
      if (r.bandoGanadorId) {
        marcador[r.bandoGanadorId] = (marcador[r.bandoGanadorId] || 0) + 1;
      }
    }

    return new Partida(
      raw.id,
      raw.eventoId,
      raw.estado,
      raw.nombre ?? undefined,
      rondas,
      marcador,
    );
  }
}
