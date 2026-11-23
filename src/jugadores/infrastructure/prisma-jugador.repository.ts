import { Injectable, ConflictException } from '@nestjs/common';
import {
  IJugadorRepository,
  PerfilCompleto,
  PartidaHistorialItem,
} from '../domain/jugador.repository.interface';
import { Jugador } from '../domain/jugador.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaJugadorRepository implements IJugadorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<Jugador, 'id' | 'createdAt'>): Promise<Jugador> {
    const raw = await this.prisma.jugador.create({
      data: {
        alias: data.alias,
        email: data.email,
        passwordHash: data.passwordHash,
        rango: data.rango ?? 'Pichón',
        avatarUrl:
          data.avatarUrl ??
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400',
        equipoId: data.equipoId,
        region: data.region ?? null,
        ciudad: data.ciudad ?? null,
        roles: data.roles ?? null,
      },
    });
    return this.mapToDomain(raw);
  }

  async findByEmail(email: string): Promise<Jugador | null> {
    const raw = await this.prisma.jugador.findUnique({ where: { email } });
    return raw ? this.mapToDomain(raw) : null;
  }

  async findByAlias(alias: string): Promise<Jugador | null> {
    const raw = await this.prisma.jugador.findUnique({ where: { alias } });
    return raw ? this.mapToDomain(raw) : null;
  }

  async findById(id: number): Promise<Jugador | null> {
    const raw = await this.prisma.jugador.findUnique({ where: { id } });
    return raw ? this.mapToDomain(raw) : null;
  }

  async obtenerPerfilCompleto(id: number): Promise<PerfilCompleto | null> {
    const raw = await this.prisma.jugador.findUnique({
      where: { id },
      include: {
        equipo: true,
        bandos: {
          include: {
            bando: {
              include: {
                rondasGanadas: true,
              },
            },
            evento: {
              include: {
                cancha: true,
                partidas: {
                  include: {
                    rondas: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!raw) return null;

    // Calcular estadísticas reales del jugador
    const eventosParticipados = raw.bandos.length;
    let rondasGanadas = 0;
    const rolesCount: Record<string, number> = {};
    const historialPartidas: PartidaHistorialItem[] = [];

    for (const jb of raw.bandos) {
      if (jb.rol) {
        // Soporta roles múltiples separados por coma (ej: "ASALTO,CQB")
        const rolesSeparados = jb.rol.split(',');
        for (const r of rolesSeparados) {
          const trimRol = r.trim();
          if (trimRol) {
            rolesCount[trimRol] = (rolesCount[trimRol] || 0) + 1;
          }
        }
      }

      if (jb.bando?.rondasGanadas) {
        rondasGanadas += jb.bando.rondasGanadas.length;
      }

      // Procesar partidas de este evento para el historial
      if (jb.evento?.partidas) {
        for (const p of jb.evento.partidas) {
          let misVictorias = 0;
          let rivalesVictorias = 0;

          for (const r of p.rondas) {
            if (r.bandoGanadorId === jb.bandoId) {
              misVictorias++;
            } else if (r.bandoGanadorId !== null) {
              rivalesVictorias++;
            }
          }

          let resultado: 'VICTORIA' | 'DERROTA' | 'EMPATE' | 'EN_JUEGO' = 'EN_JUEGO';
          if (p.rondas.length > 0) {
            if (misVictorias > rivalesVictorias) {
              resultado = 'VICTORIA';
            } else if (misVictorias < rivalesVictorias) {
              resultado = 'DERROTA';
            } else {
              resultado = 'EMPATE';
            }
          }

          historialPartidas.push({
            id: p.id,
            eventoId: jb.evento.id,
            tituloEvento: jb.evento.titulo,
            canchaNombre: jb.evento.cancha?.nombre || 'Cancha Táctica',
            fecha: jb.evento.fechaInicio || new Date(),
            rol: jb.rol,
            bandoNombre: jb.bando?.nombre || 'Mi Bando',
            resultado,
            marcador: `${misVictorias} - ${rivalesVictorias}`,
          });
        }
      }
    }

    let rolPredilecto = 'ASALTO';
    let maxRol = 0;
    for (const [r, cnt] of Object.entries(rolesCount)) {
      if (cnt > maxRol) {
        rolPredilecto = r;
        maxRol = cnt;
      }
    }

    const medallas = [
      {
        id: 'bautizo',
        titulo: 'Bautismo de Fuego',
        descripcion: 'Registrado y listo para el combate',
        icono: '🎖️',
        obtenida: true,
      },
      {
        id: 'primera_partida',
        titulo: 'Veterano de Cancha',
        descripcion: 'Ha participado en al menos 1 partida oficial',
        icono: '⚔️',
        obtenida: eventosParticipados >= 1,
      },
      {
        id: 'escuadra',
        titulo: 'Espíritu de Cuerpo',
        descripcion: 'Pertenece formalmente a un equipo de combate',
        icono: '🛡️',
        obtenida: Boolean(raw.equipoId),
      },
      {
        id: 'tirador',
        titulo: 'Tirador de Élite',
        descripcion: 'Ha ganado más de 5 rondas en partidas',
        icono: '🎯',
        obtenida: rondasGanadas >= 5,
      },
    ];

    return {
      id: raw.id,
      alias: raw.alias,
      email: raw.email,
      rango: raw.rango || 'Pichón',
      avatarUrl:
        raw.avatarUrl ||
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400',
      region: raw.region,
      ciudad: raw.ciudad,
      roles: raw.roles,
      esAdmin: raw.esAdmin ?? false,
      fama: raw.fama ?? 0,
      mvpsGanados: raw.mvpsGanados ?? 0,
      createdAt: raw.createdAt,
      equipo: raw.equipo
        ? {
            id: raw.equipo.id,
            nombre: raw.equipo.nombre,
            descripcion: raw.equipo.descripcion,
            logoUrl: raw.equipo.logoUrl,
          }
        : null,
      estadisticas: {
        eventosParticipados,
        rondasGanadas,
        rolPredilecto: maxRol > 0 ? rolPredilecto : (raw.roles ? raw.roles.split(',')[0].trim() : 'ASALTO'),
        mvpsGanados: raw.mvpsGanados ?? 0,
        fama: raw.fama ?? 0,
      },
      medallas,
      historialPartidas: historialPartidas.reverse(),
    };
  }

  async actualizarPerfil(
    id: number,
    data: {
      alias?: string;
      rango?: string;
      avatarUrl?: string;
      region?: string;
      ciudad?: string;
      roles?: string;
      equipoId?: number;
    },
  ): Promise<Jugador> {
    if (data.alias && data.alias.trim()) {
      const aliasLimpio = data.alias.trim();
      const aliasExistente = await this.prisma.jugador.findFirst({
        where: {
          alias: aliasLimpio,
          NOT: { id },
        },
      });
      if (aliasExistente) {
        throw new ConflictException(`El alias "${aliasLimpio}" ya está en uso por otro operador.`);
      }
      data.alias = aliasLimpio;
    }

    const raw = await this.prisma.jugador.update({
      where: { id },
      data,
    });
    return this.mapToDomain(raw);
  }

  private mapToDomain(raw: any): Jugador {
    return new Jugador(
      raw.id,
      raw.alias,
      raw.email,
      raw.passwordHash,
      raw.createdAt,
      raw.rango ?? undefined,
      raw.avatarUrl ?? undefined,
      raw.equipoId ?? undefined,
      raw.region ?? undefined,
      raw.ciudad ?? undefined,
      raw.roles ?? undefined,
      raw.esAdmin ?? false,
      raw.fama ?? 0,
      raw.mvpsGanados ?? 0,
    );
  }
}
