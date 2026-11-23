import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IEquipoRepository,
  FiltrosListarEquipos,
} from '../domain/equipo.repository.interface';
import { Equipo, MiembroEquipoResumen } from '../domain/equipo.entity';
import { PostulacionEquipo, EstadoPostulacion } from '../domain/postulacion.entity';

@Injectable()
export class PrismaEquipoRepository implements IEquipoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(raw: any): Equipo {
    const miembros: MiembroEquipoResumen[] = (raw.jugadores || []).map((j: any) => ({
      id: j.id,
      alias: j.alias,
      avatarUrl: j.avatarUrl,
      rango: j.rango,
      roles: j.roles,
      esCapitan: (raw.capitanId === j.id) || (raw.tlId === j.id),
      esTL: raw.tlId === j.id,
      esFundador: raw.fundadorId === j.id,
    }));

    const capitan = miembros.find((m) => m.esCapitan);
    const tl = miembros.find((m) => m.esTL);
    const fundador = miembros.find((m) => m.esFundador);

    return new Equipo({
      id: raw.id,
      nombre: raw.nombre,
      lema: raw.lema,
      descripcion: raw.descripcion,
      logoUrl: raw.logoUrl,
      region: raw.region,
      ciudad: raw.ciudad,
      capitanId: raw.capitanId,
      capitanAlias: capitan ? capitan.alias : null,
      fundadorId: raw.fundadorId,
      fundadorAlias: fundador ? fundador.alias : null,
      tlId: raw.tlId,
      tlAlias: tl ? tl.alias : (capitan ? capitan.alias : null),
      postulacionesAbiertas: raw.postulacionesAbiertas ?? true,
      activo: raw.activo ?? true,
      codigoAcceso: raw.codigoAcceso,
      fechaFundacion: raw.fechaFundacion,
      createdAt: raw.createdAt,
      totalMiembros: raw._count?.jugadores ?? miembros.length,
      miembros,
    });
  }

  async crear(equipoData: Partial<Equipo>, creadorId: number): Promise<Equipo> {
    return this.prisma.$transaction(async (tx) => {
      const nuevo = await tx.equipo.create({
        data: {
          nombre: equipoData.nombre!,
          lema: equipoData.lema,
          descripcion: equipoData.descripcion,
          logoUrl: equipoData.logoUrl,
          region: equipoData.region,
          ciudad: equipoData.ciudad,
          capitanId: creadorId,
          fundadorId: creadorId,
          tlId: creadorId,
          postulacionesAbiertas: true,
          codigoAcceso: equipoData.codigoAcceso,
          fechaFundacion: new Date(),
        },
      });

      // Vincular al jugador creador a su equipo
      await tx.jugador.update({
        where: { id: creadorId },
        data: { equipoId: nuevo.id },
      });

      const raw = await tx.equipo.findUnique({
        where: { id: nuevo.id },
        include: {
          jugadores: {
            select: {
              id: true,
              alias: true,
              avatarUrl: true,
              rango: true,
              roles: true,
            },
          },
        },
      });

      return this.mapToEntity(raw);
    });
  }

  async modificar(id: number, datos: Partial<Equipo>): Promise<Equipo> {
    const raw = await this.prisma.equipo.update({
      where: { id },
      data: {
        ...(datos.nombre && { nombre: datos.nombre }),
        ...(datos.lema !== undefined && { lema: datos.lema }),
        ...(datos.descripcion !== undefined && { descripcion: datos.descripcion }),
        ...(datos.logoUrl !== undefined && { logoUrl: datos.logoUrl }),
        ...(datos.region !== undefined && { region: datos.region }),
        ...(datos.ciudad !== undefined && { ciudad: datos.ciudad }),
      },
      include: {
        jugadores: {
          select: {
            id: true,
            alias: true,
            avatarUrl: true,
            rango: true,
            roles: true,
          },
        },
      },
    });

    return this.mapToEntity(raw);
  }

  async buscarPorId(id: number): Promise<Equipo | null> {
    const raw = await this.prisma.equipo.findUnique({
      where: { id },
      include: {
        jugadores: {
          select: {
            id: true,
            alias: true,
            avatarUrl: true,
            rango: true,
            roles: true,
          },
        },
      },
    });

    return raw ? this.mapToEntity(raw) : null;
  }

  async buscarPorCodigo(codigo: string): Promise<Equipo | null> {
    const raw = await this.prisma.equipo.findFirst({
      where: {
        codigoAcceso: {
          equals: codigo.trim().toUpperCase(),
        },
        activo: true,
      },
      include: {
        jugadores: {
          select: {
            id: true,
            alias: true,
            avatarUrl: true,
            rango: true,
            roles: true,
          },
        },
      },
    });

    return raw ? this.mapToEntity(raw) : null;
  }

  async listar(filtros?: FiltrosListarEquipos): Promise<Equipo[]> {
    const where: any = {
      activo: true,
    };

    if (filtros?.region && filtros.region !== 'TODAS' && filtros.region !== 'TODO CHILE') {
      where.region = {
        contains: filtros.region,
      };
    }

    if (filtros?.search?.trim()) {
      const q = filtros.search.trim();
      where.OR = [
        { nombre: { contains: q } },
        { lema: { contains: q } },
        { descripcion: { contains: q } },
        { ciudad: { contains: q } },
      ];
    }

    const rawList = await this.prisma.equipo.findMany({
      where,
      include: {
        _count: {
          select: { jugadores: true },
        },
        jugadores: {
          select: {
            id: true,
            alias: true,
            avatarUrl: true,
            rango: true,
            roles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return rawList.map((r) => this.mapToEntity(r));
  }

  async obtenerMiEquipo(jugadorId: number): Promise<Equipo | null> {
    const jugador = await this.prisma.jugador.findUnique({
      where: { id: jugadorId },
      select: { equipoId: true },
    });

    if (!jugador?.equipoId) return null;
    const equipo = await this.buscarPorId(jugador.equipoId);
    if (!equipo || !equipo.activo) return null;
    return equipo;
  }

  async unirJugador(equipoId: number, jugadorId: number): Promise<void> {
    await this.prisma.jugador.update({
      where: { id: jugadorId },
      data: { equipoId },
    });
  }

  async salirJugador(jugadorId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const jugador = await tx.jugador.findUnique({
        where: { id: jugadorId },
        select: { equipoId: true },
      });

      if (!jugador?.equipoId) return;

      const equipoId = jugador.equipoId;

      await tx.jugador.update({
        where: { id: jugadorId },
        data: { equipoId: null },
      });

      // Verificar si quedan miembros activos en la escuadra
      const restantes = await tx.jugador.count({
        where: { equipoId },
      });

      if (restantes === 0) {
        // Si no quedan operadores, la escuadra se deshabilita manteniendo su historial y versus intactos
        await tx.equipo.update({
          where: { id: equipoId },
          data: {
            activo: false,
            postulacionesAbiertas: false,
            tlId: null,
            capitanId: null,
          },
        });
        return;
      }

      // Si aún quedan miembros y el operador que salió era el TL o capitán, reasignar al siguiente miembro
      const equipo = await tx.equipo.findUnique({
        where: { id: equipoId },
        select: { tlId: true, capitanId: true },
      });

      if (equipo?.tlId === jugadorId || equipo?.capitanId === jugadorId) {
        const siguienteMiembro = await tx.jugador.findFirst({
          where: { equipoId },
          select: { id: true },
        });

        await tx.equipo.update({
          where: { id: equipoId },
          data: {
            tlId: siguienteMiembro ? siguienteMiembro.id : null,
            capitanId: siguienteMiembro ? siguienteMiembro.id : null,
          },
        });
      }
    });
  }

  async desintegrar(equipoId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Desvincular a todos los miembros de la escuadra
      await tx.jugador.updateMany({
        where: { equipoId },
        data: { equipoId: null },
      });

      // 2. Deshabilitar el equipo sin borrar el registro ni el historial de partidas/versus
      await tx.equipo.update({
        where: { id: equipoId },
        data: {
          activo: false,
          postulacionesAbiertas: false,
          tlId: null,
          capitanId: null,
        },
      });

      // 3. Desactivar automáticamente las canchas asociadas a esta escuadra disuelta
      await tx.cancha.updateMany({
        where: { adminEquipoId: equipoId },
        data: {
          activa: false,
          estado: 'RECHAZADA',
        },
      });
    });
  }

  async cambiarEstadoPostulaciones(equipoId: number, abiertas: boolean): Promise<Equipo> {
    const raw = await this.prisma.equipo.update({
      where: { id: equipoId },
      data: { postulacionesAbiertas: abiertas },
      include: {
        jugadores: {
          select: {
            id: true,
            alias: true,
            avatarUrl: true,
            rango: true,
            roles: true,
          },
        },
      },
    });

    return this.mapToEntity(raw);
  }

  async asignarTL(equipoId: number, nuevoTlId: number): Promise<Equipo> {
    const raw = await this.prisma.equipo.update({
      where: { id: equipoId },
      data: {
        tlId: nuevoTlId,
        capitanId: nuevoTlId,
      },
      include: {
        jugadores: {
          select: {
            id: true,
            alias: true,
            avatarUrl: true,
            rango: true,
            roles: true,
          },
        },
      },
    });

    return this.mapToEntity(raw);
  }

  private mapToPostulacion(raw: any): PostulacionEquipo {
    return new PostulacionEquipo({
      id: raw.id,
      equipoId: raw.equipoId,
      jugadorId: raw.jugadorId,
      mensaje: raw.mensaje,
      contacto: raw.contacto,
      estado: raw.estado,
      motivoRechazo: raw.motivoRechazo ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      jugadorAlias: raw.jugador?.alias,
      jugadorAvatarUrl: raw.jugador?.avatarUrl,
      jugadorRango: raw.jugador?.rango,
      jugadorRegion: raw.jugador?.region,
      jugadorCiudad: raw.jugador?.ciudad,
      jugadorEmail: raw.jugador?.email,
      equipoNombre: raw.equipo?.nombre,
      equipoLogoUrl: raw.equipo?.logoUrl,
    });
  }

  async crearPostulacion(
    equipoId: number,
    jugadorId: number,
    datos: { contacto?: string; mensaje?: string },
  ): Promise<PostulacionEquipo> {
    const raw = await this.prisma.postulacionEquipo.create({
      data: {
        equipoId,
        jugadorId,
        contacto: datos.contacto,
        mensaje: datos.mensaje,
        estado: 'PENDIENTE',
      },
      include: {
        jugador: {
          select: {
            id: true,
            alias: true,
            avatarUrl: true,
            rango: true,
            region: true,
            ciudad: true,
            email: true,
          },
        },
        equipo: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
          },
        },
      },
    });
    return this.mapToPostulacion(raw);
  }

  async listarPostulaciones(
    equipoId: number,
    estado?: EstadoPostulacion,
  ): Promise<PostulacionEquipo[]> {
    const list = await this.prisma.postulacionEquipo.findMany({
      where: {
        equipoId,
        ...(estado && { estado }),
      },
      include: {
        jugador: {
          select: {
            id: true,
            alias: true,
            avatarUrl: true,
            rango: true,
            region: true,
            ciudad: true,
            email: true,
          },
        },
        equipo: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((item) => this.mapToPostulacion(item));
  }

  async buscarPostulacionPorId(id: number): Promise<PostulacionEquipo | null> {
    const raw = await this.prisma.postulacionEquipo.findUnique({
      where: { id },
      include: {
        jugador: {
          select: {
            id: true,
            alias: true,
            avatarUrl: true,
            rango: true,
            region: true,
            ciudad: true,
            email: true,
          },
        },
        equipo: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
          },
        },
      },
    });
    return raw ? this.mapToPostulacion(raw) : null;
  }

  async actualizarEstadoPostulacion(
    id: number,
    estado: EstadoPostulacion,
    motivoRechazo?: string,
  ): Promise<PostulacionEquipo> {
    const raw = await this.prisma.postulacionEquipo.update({
      where: { id },
      data: {
        estado,
        ...(motivoRechazo !== undefined && { motivoRechazo }),
      },
      include: {
        jugador: {
          select: {
            id: true,
            alias: true,
            avatarUrl: true,
            rango: true,
            region: true,
            ciudad: true,
            email: true,
          },
        },
        equipo: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
          },
        },
      },
    });
    return this.mapToPostulacion(raw);
  }

  async obtenerPostulacionActiva(
    jugadorId: number,
    equipoId: number,
  ): Promise<PostulacionEquipo | null> {
    const raw = await this.prisma.postulacionEquipo.findFirst({
      where: {
        jugadorId,
        equipoId,
        estado: 'PENDIENTE',
      },
      include: {
        jugador: {
          select: {
            id: true,
            alias: true,
            avatarUrl: true,
            rango: true,
            region: true,
            ciudad: true,
            email: true,
          },
        },
        equipo: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
          },
        },
      },
    });
    return raw ? this.mapToPostulacion(raw) : null;
  }

  async listarMisPostulaciones(jugadorId: number): Promise<PostulacionEquipo[]> {
    const list = await this.prisma.postulacionEquipo.findMany({
      where: { jugadorId },
      include: {
        jugador: {
          select: {
            id: true,
            alias: true,
            avatarUrl: true,
            rango: true,
            region: true,
            ciudad: true,
            email: true,
          },
        },
        equipo: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((item) => this.mapToPostulacion(item));
  }
}
