import { Injectable } from '@nestjs/common';
import {
  IPartidaRepository,
  CrearPartidaData,
  RegistrarRondaData,
} from '../domain/partida.repository.interface';
import { Partida, Ronda, EstadoPartida, JugadorPartidaInfo, MvpInfo } from '../domain/partida.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaPartidaRepository implements IPartidaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CrearPartidaData): Promise<Partida> {
    const raw = await this.prisma.partida.create({
      data: {
        eventoId: data.eventoId,
        nombre: data.nombre ?? null,
        modalidadId: data.modalidadId ?? null,
        modalidadNombre: data.modalidadNombre ?? null,
        jugadores: data.jugadores && data.jugadores.length > 0
          ? {
              create: data.jugadores.map((j) => ({
                jugadorId: j.jugadorId,
                bandoId: j.bandoId,
                rol: j.rol || 'ASALTO',
              })),
            }
          : undefined,
      },
      include: {
        rondas: {
          include: { bandoGanador: true },
        },
        jugadores: {
          include: { jugador: true, bando: true },
        },
        votosMvp: {
          include: { candidato: true, bando: true },
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
        jugadores: {
          include: { jugador: true, bando: true },
        },
        votosMvp: {
          include: { candidato: true, bando: true },
        },
      },
    });

    return raw ? this.mapToDomain(raw) : null;
  }

  async findByIdConBandos(id: number): Promise<{
    partida: Partida;
    bandos: { id: number; nombre: string; colorHex?: string }[];
    organizadorId: number;
    tituloEvento: string;
    jugadores?: JugadorPartidaInfo[];
  } | null> {
    const raw = await this.prisma.partida.findUnique({
      where: { id },
      include: {
        rondas: {
          include: { bandoGanador: true },
          orderBy: { numeroRonda: 'asc' },
        },
        jugadores: {
          include: { jugador: true, bando: true },
        },
        votosMvp: {
          include: { candidato: true, bando: true },
        },
        evento: {
          include: {
            bandos: true,
          },
        },
      },
    });

    if (!raw) return null;

    const domainPartida = this.mapToDomain(raw);

    return {
      partida: domainPartida,
      bandos: raw.evento.bandos.map((b) => ({
        id: b.id,
        nombre: b.nombre,
        colorHex: b.colorHex ?? undefined,
      })),
      organizadorId: raw.evento.organizadorId,
      tituloEvento: raw.evento.titulo,
      jugadores: domainPartida.jugadores,
    };
  }

  async findByEventoId(eventoId: number): Promise<Partida[]> {
    const list = await this.prisma.partida.findMany({
      where: { eventoId },
      include: {
        rondas: {
          include: { bandoGanador: true },
          orderBy: { numeroRonda: 'asc' },
        },
        jugadores: {
          include: { jugador: true, bando: true },
        },
        votosMvp: {
          include: { candidato: true, bando: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    return list.map((item) => this.mapToDomain(item));
  }

  async actualizarEstado(partidaId: number, estado: EstadoPartida): Promise<Partida> {
    const raw = await this.prisma.partida.update({
      where: { id: partidaId },
      data: {
        estado,
        ...(estado === 'FINALIZADA' ? { finalizadaAt: new Date() } : {}),
      },
      include: {
        rondas: {
          include: { bandoGanador: true },
          orderBy: { numeroRonda: 'asc' },
        },
        jugadores: {
          include: { jugador: true, bando: true },
        },
        votosMvp: {
          include: { candidato: true, bando: true },
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

  async obtenerJugadoresDePartida(partidaId: number): Promise<JugadorPartidaInfo[]> {
    const list = await this.prisma.jugadorPartida.findMany({
      where: { partidaId },
      include: {
        jugador: {
          select: { id: true, alias: true, avatarUrl: true },
        },
        bando: {
          select: { id: true, nombre: true },
        },
      },
    });

    return list.map((jp) => ({
      jugadorId: jp.jugadorId,
      alias: jp.jugador.alias,
      avatarUrl: jp.jugador.avatarUrl ?? undefined,
      bandoId: jp.bandoId,
      bandoNombre: jp.bando.nombre,
      rol: jp.rol,
    }));
  }

  async asignarJugadorAPartida(
    partidaId: number,
    jugadorId: number,
    bandoId: number,
    rol = 'ASALTO',
  ): Promise<void> {
    await this.prisma.jugadorPartida.upsert({
      where: {
        partidaId_jugadorId: { partidaId, jugadorId },
      },
      update: {
        bandoId,
        rol,
      },
      create: {
        partidaId,
        jugadorId,
        bandoId,
        rol,
      },
    });
  }

  async registrarVotoMvp(
    partidaId: number,
    votanteId: number,
    candidatoId: number,
    bandoId: number,
  ): Promise<void> {
    await this.prisma.votoMvpPartida.upsert({
      where: {
        partidaId_votanteId: { partidaId, votanteId },
      },
      update: {
        candidatoId,
        bandoId,
      },
      create: {
        partidaId,
        votanteId,
        candidatoId,
        bandoId,
      },
    });
  }

  async haVotadoMvp(partidaId: number, votanteId: number): Promise<boolean> {
    const voto = await this.prisma.votoMvpPartida.findUnique({
      where: {
        partidaId_votanteId: { partidaId, votanteId },
      },
    });
    return Boolean(voto);
  }

  async obtenerMvpsDePartida(partidaId: number): Promise<MvpInfo[]> {
    const votos = await this.prisma.votoMvpPartida.findMany({
      where: { partidaId },
      include: {
        candidato: { select: { id: true, alias: true } },
        bando: { select: { id: true, nombre: true } },
      },
    });

    // Agrupar votos por bandoId y candidatoId
    const conteoPorBando: Record<number, { bandoNombre: string; conteo: Record<number, { alias: string; votos: number }> }> = {};

    for (const v of votos) {
      if (!conteoPorBando[v.bandoId]) {
        conteoPorBando[v.bandoId] = {
          bandoNombre: v.bando.nombre,
          conteo: {},
        };
      }
      const bandoInfo = conteoPorBando[v.bandoId];
      if (!bandoInfo.conteo[v.candidatoId]) {
        bandoInfo.conteo[v.candidatoId] = {
          alias: v.candidato.alias,
          votos: 0,
        };
      }
      bandoInfo.conteo[v.candidatoId].votos += 1;
    }

    const mvps: MvpInfo[] = [];

    for (const [bandoIdStr, bandoData] of Object.entries(conteoPorBando)) {
      const bandoId = Number(bandoIdStr);
      let mejorCandidatoId: number | null = null;
      let maxVotos = 0;
      let mejorAlias = '';

      for (const [candIdStr, candData] of Object.entries(bandoData.conteo)) {
        if (candData.votos > maxVotos) {
          maxVotos = candData.votos;
          mejorCandidatoId = Number(candIdStr);
          mejorAlias = candData.alias;
        }
      }

      if (mejorCandidatoId !== null && maxVotos > 0) {
        mvps.push({
          bandoId,
          bandoNombre: bandoData.bandoNombre,
          jugadorId: mejorCandidatoId,
          alias: mejorAlias,
          votos: maxVotos,
        });
      }
    }

    return mvps;
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

    const jugadores: JugadorPartidaInfo[] = raw.jugadores
      ? raw.jugadores.map((jp: any) => ({
          jugadorId: jp.jugadorId,
          alias: jp.jugador?.alias ?? `Operador #${jp.jugadorId}`,
          avatarUrl: jp.jugador?.avatarUrl ?? undefined,
          bandoId: jp.bandoId,
          bandoNombre: jp.bando?.nombre ?? undefined,
          rol: jp.rol,
          fama: jp.jugador?.fama ?? 0,
        }))
      : [];

    // Calcular MVPs si tiene votos cargados
    const mvps: MvpInfo[] = [];
    if (raw.votosMvp && raw.votosMvp.length > 0) {
      const conteoPorBando: Record<number, { bandoNombre: string; conteo: Record<number, { alias: string; votos: number }> }> = {};

      for (const v of raw.votosMvp) {
        if (!conteoPorBando[v.bandoId]) {
          conteoPorBando[v.bandoId] = {
            bandoNombre: v.bando?.nombre ?? `Bando #${v.bandoId}`,
            conteo: {},
          };
        }
        const bInfo = conteoPorBando[v.bandoId];
        if (!bInfo.conteo[v.candidatoId]) {
          bInfo.conteo[v.candidatoId] = {
            alias: v.candidato?.alias ?? `Operador #${v.candidatoId}`,
            votos: 0,
          };
        }
        bInfo.conteo[v.candidatoId].votos += 1;
      }

      for (const [bandoIdStr, bandoData] of Object.entries(conteoPorBando)) {
        const bandoId = Number(bandoIdStr);
        let mejorCandidatoId: number | null = null;
        let maxVotos = 0;
        let mejorAlias = '';

        for (const [candIdStr, candData] of Object.entries(bandoData.conteo)) {
          if (candData.votos > maxVotos) {
            maxVotos = candData.votos;
            mejorCandidatoId = Number(candIdStr);
            mejorAlias = candData.alias;
          }
        }

        if (mejorCandidatoId !== null) {
          mvps.push({
            bandoId,
            bandoNombre: bandoData.bandoNombre,
            jugadorId: mejorCandidatoId,
            alias: mejorAlias,
            votos: maxVotos,
          });
        }
      }
    }

    return new Partida(
      raw.id,
      raw.eventoId,
      raw.estado,
      raw.nombre ?? undefined,
      rondas,
      marcador,
      raw.modalidadId ?? undefined,
      raw.modalidadNombre ?? undefined,
      jugadores,
      mvps,
      raw.finalizadaAt ?? undefined,
      raw.createdAt ?? undefined,
    );
  }
}
