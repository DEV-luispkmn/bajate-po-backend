import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CambiarEstadoCanchaDto } from './dto/cambiar-estado-cancha.dto';
import { ResponderTicketDto } from './dto/responder-ticket.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerEstadisticas() {
    const [
      totalJugadores,
      totalCanchasActivas,
      canchasPendientesRevision,
      ticketsPendientes,
      totalTickets,
      totalEquipos,
      totalEventos,
    ] = await Promise.all([
      this.prisma.jugador.count(),
      this.prisma.cancha.count({ where: { estado: 'ACTIVA' } }),
      this.prisma.cancha.count({ where: { estado: 'EN_REVISION' } }),
      this.prisma.ticketSoporte.count({ where: { estado: 'PENDIENTE', tipo: { not: 'CANCHA' } } }),
      this.prisma.ticketSoporte.count({ where: { tipo: { not: 'CANCHA' } } }),
      this.prisma.equipo.count(),
      this.prisma.evento.count(),
    ]);

    return {
      totalJugadores,
      totalCanchasActivas,
      canchasPendientesRevision,
      ticketsPendientes,
      totalTickets,
      totalEquipos,
      totalEventos,
    };
  }

  async listarCanchas(estado?: string, region?: string) {
    const where: any = {};
    if (estado && estado !== 'TODAS') {
      where.estado = estado;
    }
    if (region && region !== 'TODAS') {
      where.region = { contains: region };
    }

    return this.prisma.cancha.findMany({
      where,
      include: {
        fotos: true,
        creador: {
          select: {
            id: true,
            alias: true,
            email: true,
          },
        },
        equipoAdmin: {
          select: {
            id: true,
            nombre: true,
            activo: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async cambiarEstadoCancha(id: number, dto: CambiarEstadoCanchaDto) {
    const cancha = await this.prisma.cancha.findUnique({
      where: { id },
      include: { creador: true },
    });

    if (!cancha) {
      throw new NotFoundException(`La cancha con ID ${id} no existe.`);
    }

    const activa = dto.estado === 'ACTIVA';

    const canchaActualizada = await this.prisma.cancha.update({
      where: { id },
      data: {
        estado: dto.estado,
        activa,
      },
      include: {
        fotos: true,
        creador: {
          select: { id: true, alias: true, email: true },
        },
        equipoAdmin: {
          select: { id: true, nombre: true, activo: true },
        },
      },
    });

    // Si la cancha tenía ticket de revisión asociado, responderlo automáticamente
    if (cancha.creadorId) {
      const ticketRelacionado = await this.prisma.ticketSoporte.findFirst({
        where: {
          jugadorId: cancha.creadorId,
          tipo: 'CANCHA',
          titulo: { contains: cancha.nombre },
        },
      });

      if (ticketRelacionado) {
        let respuestaStaff = '';
        if (dto.estado === 'ACTIVA') {
          respuestaStaff = `✅ ¡FELICIDADES! Tu propuesta para "${cancha.nombre}" ha sido revisada y APROBADA por la Comandancia. Ya está activa en el radar táctico para crear partidas y versus.`;
        } else if (dto.estado === 'RECHAZADA') {
          respuestaStaff = `❌ Tu propuesta para "${cancha.nombre}" no cumple con los requisitos mínimos de validación${dto.motivo ? `: ${dto.motivo}` : '.'}`;
        } else {
          respuestaStaff = `⏳ La cancha "${cancha.nombre}" se encuentra bajo revisión técnica.${dto.motivo ? ` Nota: ${dto.motivo}` : ''}`;
        }

        await this.prisma.ticketSoporte.update({
          where: { id: ticketRelacionado.id },
          data: {
            estado: dto.estado === 'ACTIVA' ? 'RESPONDIDO' : dto.estado === 'RECHAZADA' ? 'CERRADO' : 'EN_REVISION',
            respuestaAdmin: respuestaStaff,
          },
        });
      }
    }

    return canchaActualizada;
  }

  async modificarCancha(
    id: number,
    data: {
      nombre?: string;
      descripcion?: string;
      region?: string;
      ciudad?: string;
      latitud?: number;
      longitud?: number;
      esAbierta?: boolean;
      adminEquipoId?: number | null;
      activa?: boolean;
      estado?: 'EN_REVISION' | 'ACTIVA' | 'RECHAZADA';
    },
  ) {
    const cancha = await this.prisma.cancha.findUnique({ where: { id } });
    if (!cancha) {
      throw new NotFoundException(`La cancha #${id} no existe.`);
    }

    let adminEquipoId = data.adminEquipoId;
    let esAbierta = data.esAbierta;

    // Si adminEquipoId viene definido explícitamente:
    if (data.adminEquipoId !== undefined) {
      if (!data.adminEquipoId) {
        adminEquipoId = null;
        if (esAbierta === undefined) esAbierta = true;
      } else {
        const equipo = await this.prisma.equipo.findUnique({
          where: { id: data.adminEquipoId },
        });
        if (!equipo) {
          throw new NotFoundException(`El equipo #${data.adminEquipoId} no existe.`);
        }
        adminEquipoId = data.adminEquipoId;
        if (esAbierta === undefined) esAbierta = false;
      }
    } else if (esAbierta === true) {
      // Si la cancha se pasa a abierta explícitamente sin especificar equipo, se desvincula del equipo
      adminEquipoId = null;
    }

    return this.prisma.cancha.update({
      where: { id },
      data: {
        nombre: data.nombre !== undefined ? data.nombre : undefined,
        descripcion: data.descripcion !== undefined ? data.descripcion : undefined,
        region: data.region !== undefined ? data.region : undefined,
        ciudad: data.ciudad !== undefined ? data.ciudad : undefined,
        latitud: data.latitud !== undefined ? data.latitud : undefined,
        longitud: data.longitud !== undefined ? data.longitud : undefined,
        esAbierta: esAbierta !== undefined ? esAbierta : undefined,
        adminEquipoId: adminEquipoId !== undefined ? adminEquipoId : undefined,
        activa: data.activa !== undefined ? data.activa : undefined,
        estado: data.estado !== undefined ? data.estado : undefined,
      },
      include: {
        fotos: true,
        creador: { select: { id: true, alias: true, email: true } },
        equipoAdmin: { select: { id: true, nombre: true, activo: true } },
      },
    });
  }

  async listarTickets(tipo?: string, estado?: string) {
    const where: any = {};
    if (tipo && tipo !== 'TODOS') {
      where.tipo = tipo as any;
    } else {
      // Los tickets de propuesta de cancha se gestionan exclusivamente en el módulo de Canchas
      where.tipo = { not: 'CANCHA' };
    }
    if (estado && estado !== 'TODOS') {
      where.estado = estado as any;
    }

    return this.prisma.ticketSoporte.findMany({
      where,
      include: {
        jugador: {
          select: {
            id: true,
            alias: true,
            email: true,
            rango: true,
            avatarUrl: true,
            region: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async responderTicket(id: number, dto: ResponderTicketDto) {
    const ticket = await this.prisma.ticketSoporte.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`El ticket #${id} no fue encontrado.`);
    }

    return this.prisma.ticketSoporte.update({
      where: { id },
      data: {
        estado: dto.estado,
        respuestaAdmin: dto.respuestaAdmin.trim(),
      },
      include: {
        jugador: {
          select: {
            id: true,
            alias: true,
            email: true,
          },
        },
      },
    });
  }

  async listarJugadores(busqueda?: string, region?: string) {
    const where: any = {};
    if (busqueda && busqueda.trim()) {
      const q = busqueda.trim();
      where.OR = [
        { alias: { contains: q } },
        { email: { contains: q } },
        { region: { contains: q } },
      ];
    }
    if (region && region !== 'TODAS') {
      where.region = { contains: region };
    }

    return this.prisma.jugador.findMany({
      where,
      select: {
        id: true,
        alias: true,
        email: true,
        rango: true,
        region: true,
        ciudad: true,
        roles: true,
        esAdmin: true,
        avatarUrl: true,
        createdAt: true,
        equipo: {
          select: {
            id: true,
            nombre: true,
          },
        },
        _count: {
          select: {
            bandos: true,
            eventosCreados: true,
            tickets: true,
          },
        },
      },
      orderBy: [{ id: 'asc' }],
    });
  }

  async toggleAdminJugador(id: number, esAdmin: boolean) {
    const jugador = await this.prisma.jugador.findUnique({ where: { id } });
    if (!jugador) {
      throw new NotFoundException(`El operador #${id} no existe.`);
    }

    return this.prisma.jugador.update({
      where: { id },
      data: { esAdmin },
      select: {
        id: true,
        alias: true,
        email: true,
        esAdmin: true,
      },
    });
  }

  async eliminarJugador(id: number) {
    const jugador = await this.prisma.jugador.findUnique({
      where: { id },
    });

    if (!jugador) {
      throw new NotFoundException(`El operador #${id} no existe.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Desvincular canchas creadas por el jugador (para conservarlas en el radar)
      await tx.cancha.updateMany({
        where: { creadorId: id },
        data: { creadorId: null },
      });

      // 2. Si es líder de escuadra, desvincular sus cargos
      await tx.equipo.updateMany({
        where: { capitanId: id },
        data: { capitanId: null },
      });
      await tx.equipo.updateMany({
        where: { fundadorId: id },
        data: { fundadorId: null },
      });
      await tx.equipo.updateMany({
        where: { tlId: id },
        data: { tlId: null },
      });

      // 3. Eliminar inscripciones en bandos/partidas
      await tx.jugadorBando.deleteMany({
        where: { jugadorId: id },
      });

      // 4. Si creó eventos, eliminar sus dependencias y eventos
      const eventos = await tx.evento.findMany({
        where: { organizadorId: id },
        select: { id: true },
      });

      if (eventos.length > 0) {
        const evIds = eventos.map((e) => e.id);
        await tx.jugadorBando.deleteMany({
          where: { eventoId: { in: evIds } },
        });
        await tx.evento.deleteMany({
          where: { id: { in: evIds } },
        });
      }

      // 5. Eliminar logros y tickets
      await tx.jugadorLogro.deleteMany({
        where: { jugadorId: id },
      });
      await tx.ticketSoporte.deleteMany({
        where: { jugadorId: id },
      });

      // 6. Eliminar el operador
      const eliminado = await tx.jugador.delete({
        where: { id },
      });

      return {
        mensaje: `Operador "${eliminado.alias}" (${eliminado.email}) eliminado del registro.`,
        id: eliminado.id,
      };
    });
  }

  async listarEquipos(region?: string, activo?: boolean) {
    const where: any = {};
    if (region && region !== 'TODAS') {
      where.region = { contains: region };
    }
    if (activo !== undefined) {
      where.activo = activo;
    }

    return this.prisma.equipo.findMany({
      where,
      include: {
        jugadores: {
          select: {
            id: true,
            alias: true,
            email: true,
            rango: true,
          },
        },
        canchasAdmin: {
          select: {
            id: true,
            nombre: true,
            estado: true,
          },
        },
        _count: {
          select: {
            jugadores: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async toggleActivoEquipo(id: number, activo: boolean) {
    const equipo = await this.prisma.equipo.findUnique({ where: { id } });
    if (!equipo) {
      throw new NotFoundException(`El equipo #${id} no existe.`);
    }

    return this.prisma.equipo.update({
      where: { id },
      data: { activo },
      include: {
        jugadores: {
          select: {
            id: true,
            alias: true,
            email: true,
            rango: true,
          },
        },
        canchasAdmin: {
          select: {
            id: true,
            nombre: true,
            estado: true,
          },
        },
        _count: {
          select: {
            jugadores: true,
          },
        },
      },
    });
  }
}
