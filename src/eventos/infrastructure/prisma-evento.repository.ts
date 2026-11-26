import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  IEventoRepository,
  CrearEventoData,
  ModificarEventoData,
  FiltrosListarEventos,
} from '../domain/evento.repository.interface';
import { Evento, Bando, Escuadra, JugadorEnBando, EstadoEvento } from '../domain/evento.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaEventoRepository implements IEventoRepository, OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeEventoCompleto = {
    bandos: {
      orderBy: { id: 'asc' as const },
      include: {
        lider: true,
        escuadras: {
          include: {
            lider: true,
            _count: {
              select: { jugadores: true },
            },
          },
        },
        _count: {
          select: { jugadores: true },
        },
      },
    },
    cancha: true,
    organizador: true,
    organizadores: {
      include: {
        jugador: true,
      },
    },
    jugadores: {
      select: {
        jugadorId: true,
        bandoId: true,
        escuadraId: true,
        rol: true,
      },
    },
    tacsop: true,
    fases: {
      orderBy: { orden: 'asc' as const },
    },
    registrosCrono: {
      include: {
        jugador: {
          select: { alias: true },
        },
      },
    },
    misiones: {
      include: {
        bando: {
          select: { nombre: true, colorHex: true },
        },
      },
      orderBy: { createdAt: 'desc' as const },
    },
  };

  onModuleInit() {
    this.asegurarTablaMisiones().catch((err) =>
      console.warn('Aviso en inicialización de tabla MisionEvento:', err?.message),
    );
    // Chequeo y cancelación de partidas vencidas al iniciar y cada 1 minuto
    this.cancelarEventosVencidos().catch((err) =>
      console.warn('Error en chequeo inicial de partidas vencidas:', err),
    );
    setInterval(() => {
      this.cancelarEventosVencidos().catch((err) =>
        console.warn('Error en chequeo periódico de partidas vencidas:', err),
      );
    }, 60000);
  }

  async cancelarEventosVencidos(): Promise<number> {
    const ahora = new Date();
    try {
      const resultado = await this.prisma.evento.updateMany({
        where: {
          estado: 'PROGRAMADO',
          OR: [
            {
              fechaFin: {
                not: null,
                lt: ahora,
              },
            },
            {
              fechaFin: null,
              fechaInicio: {
                not: null,
                lt: ahora,
              },
            },
          ],
        },
        data: {
          estado: 'CANCELADO',
          motivoCancelacion: 'Fuera de fecha',
        },
      });

      return resultado.count;
    } catch (error) {
      console.error('Error al cancelar eventos vencidos:', error);
      return 0;
    }
  }

  private async asegurarTablaMisiones(): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`MisionEvento\` (
          \`id\` INT NOT NULL AUTO_INCREMENT,
          \`eventoId\` INT NOT NULL,
          \`bandoId\` INT NOT NULL,
          \`titulo\` VARCHAR(150) NOT NULL,
          \`descripcionLider\` TEXT NOT NULL,
          \`descripcionOperadores\` TEXT NOT NULL,
          \`fotoUrl\` LONGTEXT NULL,
          \`estado\` VARCHAR(50) NOT NULL DEFAULT 'ACTIVA',
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`),
          INDEX \`MisionEvento_eventoId_idx\` (\`eventoId\`),
          INDEX \`MisionEvento_bandoId_idx\` (\`bandoId\`),
          CONSTRAINT \`MisionEvento_eventoId_fkey\` FOREIGN KEY (\`eventoId\`) REFERENCES \`Evento\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT \`MisionEvento_bandoId_fkey\` FOREIGN KEY (\`bandoId\`) REFERENCES \`Bando\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      `);
    } catch {
      // Ignorar si la base de datos no está disponible en este momento
    }
  }

  async create(data: CrearEventoData): Promise<Evento> {
    const raw = await this.prisma.evento.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion ?? null,
        tipo: data.tipo,
        privacidad: data.privacidad,
        canchaId: data.canchaId ?? null,
        latitud: data.latitud ?? null,
        longitud: data.longitud ?? null,
        direccionTexto: data.direccionTexto ?? null,
        mapaTacticoUrl: data.mapaTacticoUrl ?? null,
        mapaPines: data.mapaPines ?? null,
        organizadorId: data.organizadorId,
        fechaInicio: data.fechaInicio ?? null,
        fechaFin: data.fechaFin ?? null,
        region: data.region ?? null,
        ciudad: data.ciudad ?? null,
        equipoAId: data.equipoAId ?? null,
        equipoBId: data.equipoBId ?? null,
        codigoInvitacion: data.codigoInvitacion,
        bandos: {
          create: data.bandos.map((b) => ({
            nombre: b.nombre,
            colorHex: b.colorHex ?? null,
            qrToken: b.qrToken,
            cupoMax: b.cupoMax ?? null,
            frecuenciaRadio: b.frecuenciaRadio ?? null,
            subtonoRadio: b.subtonoRadio ?? null,
          })),
        },
      },
      include: this.includeEventoCompleto,
    });

    return this.mapToDomain(raw);
  }

  async findById(id: number): Promise<Evento | null> {
    await this.cancelarEventosVencidos();
    const raw = await this.prisma.evento.findUnique({
      where: { id },
      include: this.includeEventoCompleto,
    });

    return raw ? this.mapToDomain(raw) : null;
  }

  async findByCodigoInvitacion(codigo: string): Promise<Evento | null> {
    await this.cancelarEventosVencidos();
    const raw = await this.prisma.evento.findUnique({
      where: { codigoInvitacion: codigo },
      include: this.includeEventoCompleto,
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
    await this.cancelarEventosVencidos();
    const where: any = {};
    if (filtros?.estado) where.estado = filtros.estado;
    if (filtros?.tipo) where.tipo = filtros.tipo;
    if (filtros?.privacidad) where.privacidad = filtros.privacidad;
    if (filtros?.region) where.region = filtros.region;

    // Regla táctica de privacidad para VERSUS:
    // Una partida VERSUS solo es visible en el radar para miembros de las 2 escuadras en disputa,
    // el comandante organizador, o jugadores invitados/parche ya inscritos.
    let playerEquipoId: number | null = null;
    if (filtros?.jugadorId) {
      const j = await this.prisma.jugador.findUnique({
        where: { id: filtros.jugadorId },
        select: { equipoId: true },
      });
      playerEquipoId = j?.equipoId ?? null;
    }

    const versusFilter = filtros?.jugadorId
      ? {
          OR: [
            { tipo: { not: 'VERSUS' } },
            {
              tipo: 'VERSUS',
              OR: [
                ...(playerEquipoId
                  ? [{ equipoAId: playerEquipoId }, { equipoBId: playerEquipoId }]
                  : []),
                { organizadorId: filtros.jugadorId },
                { jugadores: { some: { jugadorId: filtros.jugadorId } } },
              ],
            },
          ],
        }
      : { tipo: { not: 'VERSUS' } };

    where.AND = [versusFilter];

    const list = await this.prisma.evento.findMany({
      where,
      orderBy: { fechaInicio: 'desc' },
      include: this.includeEventoCompleto,
    });

    return list.map((item) => this.mapToDomain(item));
  }

  async findJugadorEquipoId(jugadorId: number): Promise<number | null> {
    const jugador = await this.prisma.jugador.findUnique({
      where: { id: jugadorId },
      select: { equipoId: true },
    });
    return jugador?.equipoId ?? null;
  }

  async unirJugadorABando(
    eventoId: number,
    jugadorId: number,
    bandoId?: number | null,
    rol: string = 'ASALTO',
  ): Promise<JugadorEnBando> {
    const raw = await this.prisma.jugadorBando.upsert({
      where: {
        eventoId_jugadorId: {
          eventoId,
          jugadorId,
        },
      },
      update: {
        bandoId: bandoId ?? null,
        rol,
      },
      create: {
        eventoId,
        jugadorId,
        bandoId: bandoId ?? null,
        rol,
      },
      include: {
        jugador: true,
        escuadra: true,
      },
    });

    return new JugadorEnBando(
      raw.eventoId,
      raw.jugadorId,
      raw.bandoId ?? undefined,
      raw.rol,
      raw.jugador?.alias,
      raw.jugador?.avatarUrl ?? undefined,
      raw.escuadraId ?? undefined,
      raw.escuadra?.nombre ?? undefined,
    );
  }

  async obtenerJugadoresDeEvento(eventoId: number): Promise<JugadorEnBando[]> {
    const list = await this.prisma.jugadorBando.findMany({
      where: { eventoId },
      include: {
        jugador: true,
        escuadra: true,
      },
    });

    return list.map(
      (item) =>
        new JugadorEnBando(
          item.eventoId,
          item.jugadorId,
          item.bandoId ?? undefined,
          item.rol,
          item.jugador?.alias,
          item.jugador?.avatarUrl ?? undefined,
          item.escuadraId ?? undefined,
          item.escuadra?.nombre ?? undefined,
          item.jugador?.fama ?? 0,
        ),
    );
  }

  async desinscribirJugador(eventoId: number, jugadorId: number): Promise<void> {
    const evId = Number(eventoId);
    const jId = Number(jugadorId);

    // 1. Eliminar combatiente de bando y escuadra
    await this.prisma.jugadorBando.deleteMany({
      where: {
        eventoId: evId,
        jugadorId: jId,
      },
    });

    // 2. Si era líder de alguna facción/bando del evento, quitar el rango
    await this.prisma.bando.updateMany({
      where: {
        eventoId: evId,
        liderId: jId,
      },
      data: {
        liderId: null,
      },
    });

    // 3. Si era líder de alguna escuadra de los bandos de este evento, quitar el rango
    const bandosDelEvento = await this.prisma.bando.findMany({
      where: { eventoId: evId },
      select: { id: true },
    });
    const bandoIds = bandosDelEvento.map((b) => b.id);
    if (bandoIds.length > 0) {
      await this.prisma.escuadra.updateMany({
        where: {
          bandoId: { in: bandoIds },
          liderId: jId,
        },
        data: {
          liderId: null,
        },
      });
    }

    // 4. Quitar privilegios de co-organizador asignado en este evento
    await this.prisma.organizadorEvento.deleteMany({
      where: {
        eventoId: evId,
        jugadorId: jId,
      },
    });

    // 5. Eliminar registros de cronometraje de réplicas en este evento
    await this.prisma.registroCronoReplica.deleteMany({
      where: {
        eventoId: evId,
        jugadorId: jId,
      },
    });
  }

  async actualizarEstado(
    eventoId: number,
    nuevoEstado: EstadoEvento,
    motivoCancelacion?: string,
  ): Promise<Evento> {
    const data: any = { estado: nuevoEstado };
    if (motivoCancelacion !== undefined) {
      data.motivoCancelacion = motivoCancelacion;
    }

    const raw = await this.prisma.evento.update({
      where: { id: eventoId },
      data,
      include: this.includeEventoCompleto,
    });

    return this.mapToDomain(raw);
  }

  async modificar(id: number, data: ModificarEventoData): Promise<Evento> {
    const raw = await this.prisma.evento.update({
      where: { id },
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        canchaId: data.canchaId,
        latitud: data.latitud,
        longitud: data.longitud,
        direccionTexto: data.direccionTexto,
        mapaTacticoUrl: data.mapaTacticoUrl,
        mapaPines: data.mapaPines,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        region: data.region,
        ciudad: data.ciudad,
        estado: data.estado,
        inscripcionesAbiertas: data.inscripcionesAbiertas,
      },
      include: this.includeEventoCompleto,
    });

    return this.mapToDomain(raw);
  }

  async eliminar(id: number): Promise<void> {
    await this.prisma.evento.delete({
      where: { id },
    });
  }

  async listarEquipos(): Promise<{ id: number; nombre: string; logoUrl?: string | null }[]> {
    return this.prisma.equipo.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        logoUrl: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async actualizarInscripciones(eventoId: number, abiertas: boolean): Promise<Evento> {
    const raw = await this.prisma.evento.update({
      where: { id: eventoId },
      data: { inscripcionesAbiertas: abiertas },
      include: this.includeEventoCompleto,
    });
    return this.mapToDomain(raw);
  }

  async designarLiderBando(bandoId: number, liderId: number | null): Promise<void> {
    await this.prisma.bando.update({
      where: { id: bandoId },
      data: { liderId },
    });
  }

  async crearEscuadra(
    bandoId: number,
    nombre: string,
    cupoMax: number = 10,
    liderId?: number,
  ): Promise<Escuadra> {
    const raw = await this.prisma.escuadra.create({
      data: {
        bandoId,
        nombre,
        cupoMax,
        liderId: liderId ?? null,
      },
      include: {
        lider: true,
        _count: { select: { jugadores: true } },
      },
    });

    return new Escuadra(
      raw.id,
      raw.bandoId,
      raw.nombre,
      raw.cupoMax ?? 10,
      raw.liderId ?? undefined,
      raw.lider?.alias ?? undefined,
      raw._count?.jugadores ?? 0,
    );
  }

  async eliminarEscuadra(escuadraId: number): Promise<void> {
    await this.prisma.escuadra.delete({
      where: { id: escuadraId },
    });
  }

  async obtenerEscuadra(escuadraId: number): Promise<any | null> {
    return this.prisma.escuadra.findUnique({
      where: { id: escuadraId },
      include: {
        bando: true,
        lider: true,
        _count: { select: { jugadores: true } },
      },
    });
  }

  async asignarEscuadraJugador(
    eventoId: number,
    jugadorId: number,
    escuadraId: number | null,
  ): Promise<void> {
    await this.prisma.jugadorBando.update({
      where: {
        eventoId_jugadorId: {
          eventoId,
          jugadorId,
        },
      },
      data: {
        escuadraId,
      },
    });
  }

  async agregarCoorganizador(eventoId: number, jugadorId: number): Promise<void> {
    await this.prisma.organizadorEvento.upsert({
      where: {
        eventoId_jugadorId: {
          eventoId,
          jugadorId,
        },
      },
      update: {},
      create: {
        eventoId,
        jugadorId,
      },
    });
  }

  async removerCoorganizador(eventoId: number, jugadorId: number): Promise<void> {
    await this.prisma.organizadorEvento.deleteMany({
      where: {
        eventoId,
        jugadorId,
      },
    });
  }

  async esOrganizador(eventoId: number, jugadorId: number): Promise<boolean> {
    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
      select: {
        organizadorId: true,
        organizadores: {
          where: { jugadorId },
          select: { jugadorId: true },
        },
      },
    });

    if (!evento) return false;
    if (evento.organizadorId === jugadorId) return true;
    return evento.organizadores.length > 0;
  }

  async guardarTacsop(eventoId: number, tacsop: any): Promise<any> {
    const raw = await this.prisma.eventoTacsop.upsert({
      where: { eventoId },
      update: {
        presetTipo: tacsop.presetTipo ?? 'CUSTOM',
        vidasMax: tacsop.vidasMax ?? 2,
        requiereTorniquete: tacsop.requiereTorniquete ?? true,
        torniquetesPorJugador: tacsop.torniquetesPorJugador ?? 1,
        tiempoDesangradoMin: tacsop.tiempoDesangradoMin ?? 5,
        soloMedicoRevive: tacsop.soloMedicoRevive ?? false,
        requierePanueloRojo: tacsop.requierePanueloRojo ?? true,
        luzRojaNocturna: tacsop.luzRojaNocturna ?? 'RECOMENDADA',
        tipoCargadores: tacsop.tipoCargadores ?? 'MID_CAP',
        limiteMunicionBbs: tacsop.limiteMunicionBbs ?? null,
        pirotecniaPermitida: tacsop.pirotecniaPermitida ?? false,
        humoFrioPermitido: tacsop.humoFrioPermitido ?? true,
        limitesCrono: tacsop.limitesCrono ?? null,
        frecuenciaEmergencia: tacsop.frecuenciaEmergencia ?? null,
        frecuenciaStaff: tacsop.frecuenciaStaff ?? null,
        subtonoStaff: tacsop.subtonoStaff ?? null,
        reglasAdicionales: tacsop.reglasAdicionales ?? null,
      },
      create: {
        eventoId,
        presetTipo: tacsop.presetTipo ?? 'CUSTOM',
        vidasMax: tacsop.vidasMax ?? 2,
        requiereTorniquete: tacsop.requiereTorniquete ?? true,
        torniquetesPorJugador: tacsop.torniquetesPorJugador ?? 1,
        tiempoDesangradoMin: tacsop.tiempoDesangradoMin ?? 5,
        soloMedicoRevive: tacsop.soloMedicoRevive ?? false,
        requierePanueloRojo: tacsop.requierePanueloRojo ?? true,
        luzRojaNocturna: tacsop.luzRojaNocturna ?? 'RECOMENDADA',
        tipoCargadores: tacsop.tipoCargadores ?? 'MID_CAP',
        limiteMunicionBbs: tacsop.limiteMunicionBbs ?? null,
        pirotecniaPermitida: tacsop.pirotecniaPermitida ?? false,
        humoFrioPermitido: tacsop.humoFrioPermitido ?? true,
        limitesCrono: tacsop.limitesCrono ?? null,
        frecuenciaEmergencia: tacsop.frecuenciaEmergencia ?? null,
        frecuenciaStaff: tacsop.frecuenciaStaff ?? null,
        subtonoStaff: tacsop.subtonoStaff ?? null,
        reglasAdicionales: tacsop.reglasAdicionales ?? null,
      },
    });
    return raw;
  }

  async crearFase(eventoId: number, datos: any): Promise<any> {
    const orden = datos.orden ?? (await this.prisma.faseEvento.count({ where: { eventoId } })) + 1;
    return this.prisma.faseEvento.create({
      data: {
        eventoId,
        orden,
        nombre: datos.nombre,
        descripcion: datos.descripcion ?? null,
        horaInicio: datos.horaInicio ? new Date(datos.horaInicio) : null,
        horaFin: datos.horaFin ? new Date(datos.horaFin) : null,
        esFaseCrono: datos.esFaseCrono ?? false,
        activa: datos.activa ?? false,
        completada: false,
      },
    });
  }

  async actualizarFase(faseId: number, datos: any): Promise<any> {
    return this.prisma.faseEvento.update({
      where: { id: faseId },
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        horaInicio: datos.horaInicio ? new Date(datos.horaInicio) : undefined,
        horaFin: datos.horaFin ? new Date(datos.horaFin) : undefined,
        esFaseCrono: datos.esFaseCrono,
        activa: datos.activa,
        completada: datos.completada,
      },
    });
  }

  async eliminarFase(faseId: number): Promise<void> {
    await this.prisma.faseEvento.delete({
      where: { id: faseId },
    });
  }

  async activarFase(eventoId: number, faseId: number): Promise<void> {
    const fase = await this.prisma.faseEvento.findUnique({ where: { id: faseId } });
    if (!fase) return;

    await this.prisma.faseEvento.updateMany({
      where: { eventoId, orden: { lt: fase.orden } },
      data: { activa: false, completada: true },
    });
    await this.prisma.faseEvento.updateMany({
      where: { eventoId, orden: { gt: fase.orden } },
      data: { activa: false, completada: false },
    });
    await this.prisma.faseEvento.update({
      where: { id: faseId },
      data: { activa: true, completada: false },
    });

    // Al entrar a la fase 1 (o superior, orden > 1 en eventos masivos), pasar a EN_CURSO y cerrar automáticamente las inscripciones
    if (fase.orden > 1) {
      await this.prisma.evento.update({
        where: { id: eventoId },
        data: {
          estado: 'EN_CURSO',
          inscripcionesAbiertas: false,
        },
      });
    } else if (fase.orden === 1) {
      // Si se regresa a la fase 0 (orden 1), el evento vuelve a estar PROGRAMADO
      await this.prisma.evento.update({
        where: { id: eventoId },
        data: {
          estado: 'PROGRAMADO',
        },
      });
    }

    // Para la fase 3 (orden >= 4: Conclusión y Debriefing), las misiones ya no están activas
    if (fase.orden >= 4) {
      try {
        await (this.prisma as any).misionEvento.updateMany({
          where: { eventoId, estado: 'ACTIVA' },
          data: { estado: 'COMPLETADA' },
        });
      } catch {
        // En caso de que no haya misiones o tabla no inicializada
      }
    }
  }

  async registrarCronoReplica(datos: any): Promise<any> {
    return this.prisma.registroCronoReplica.create({
      data: {
        eventoId: datos.eventoId,
        jugadorId: datos.jugadorId,
        tipoReplica: datos.tipoReplica ?? 'PRIMARIA',
        categoria: datos.categoria,
        modelo: datos.modelo ?? null,
        joules: Number(datos.joules),
        fps: datos.fps ? Number(datos.fps) : null,
        gramajeBb: datos.gramajeBb ? Number(datos.gramajeBb) : null,
        aprobado: datos.aprobado ?? true,
        notas: datos.notas ?? null,
        cronoPorId: datos.cronoPorId ?? null,
      },
      include: {
        jugador: {
          select: { alias: true },
        },
      },
    });
  }

  async eliminarRegistroCrono(cronoId: number): Promise<void> {
    await this.prisma.registroCronoReplica.delete({
      where: { id: cronoId },
    });
  }

  async registrarReplicasDeclaradas(eventoId: number, jugadorId: number, replicas: any[]): Promise<void> {
    await this.prisma.registroCronoReplica.deleteMany({
      where: {
        eventoId,
        jugadorId,
        cronoPorId: null,
      },
    });

    for (const r of replicas) {
      const fps = r.fpsEstimado ? Number(r.fpsEstimado) : null;
      let joules = r.joulesEstimados ? Number(r.joulesEstimados) : 0;
      if (!joules && fps) {
        joules = Number((0.5 * 0.0002 * Math.pow(fps * 0.3048, 2)).toFixed(2));
      }

      await this.prisma.registroCronoReplica.create({
        data: {
          eventoId,
          jugadorId,
          tipoReplica: r.tipoReplica || 'PRIMARIA',
          categoria: r.categoria,
          modelo: r.modelo || null,
          fps,
          joules,
          gramajeBb: 0.20,
          aprobado: false,
          notas: 'DECLARADA_EN_INSCRIPCION',
          cronoPorId: null,
        },
      });
    }
  }

  async actualizarCommsBando(bandoId: number, frecuenciaRadio?: string, subtonoRadio?: string): Promise<void> {
    await this.prisma.bando.update({
      where: { id: bandoId },
      data: {
        frecuenciaRadio: frecuenciaRadio ?? null,
        subtonoRadio: subtonoRadio ?? null,
      },
    });
  }

  async actualizarCommsEscuadra(escuadraId: number, frecuenciaRadio?: string, subtonoRadio?: string): Promise<void> {
    await this.prisma.escuadra.update({
      where: { id: escuadraId },
      data: {
        frecuenciaRadio: frecuenciaRadio ?? null,
        subtonoRadio: subtonoRadio ?? null,
      },
    });
  }

  async actualizarMapaTactico(eventoId: number, mapaTacticoUrl?: string, mapaPines?: any): Promise<void> {
    await this.prisma.evento.update({
      where: { id: eventoId },
      data: {
        mapaTacticoUrl: mapaTacticoUrl !== undefined ? mapaTacticoUrl : undefined,
        mapaPines: mapaPines !== undefined ? mapaPines : undefined,
      },
    });
  }

  async crearMision(eventoId: number, datos: any): Promise<any> {
    return (this.prisma as any).misionEvento.create({
      data: {
        eventoId,
        bandoId: Number(datos.bandoId),
        titulo: datos.titulo,
        descripcionLider: datos.descripcionLider,
        descripcionOperadores: datos.descripcionOperadores,
        fotoUrl: datos.fotoUrl ?? null,
        estado: datos.estado || 'ACTIVA',
      },
      include: {
        bando: {
          select: { nombre: true, colorHex: true },
        },
      },
    });
  }

  async actualizarEstadoMision(misionId: number, estado: string): Promise<any> {
    return (this.prisma as any).misionEvento.update({
      where: { id: misionId },
      data: { estado },
      include: {
        bando: {
          select: { nombre: true, colorHex: true },
        },
      },
    });
  }

  async eliminarMision(misionId: number): Promise<void> {
    await (this.prisma as any).misionEvento.delete({
      where: { id: misionId },
    });
  }

  private mapToDomain(raw: any): Evento {
    const bandos = raw.bandos?.map((b: any) => {
      const escuadras = b.escuadras?.map(
        (e: any) =>
          new Escuadra(
            e.id,
            e.bandoId,
            e.nombre,
            e.cupoMax ?? 10,
            e.liderId ?? undefined,
            e.lider?.alias ?? undefined,
            e._count?.jugadores ?? 0,
            e.frecuenciaRadio ?? undefined,
            e.subtonoRadio ?? undefined,
          ),
      );

      return new Bando(
        b.id,
        b.eventoId,
        b.nombre,
        b.colorHex ?? undefined,
        b.qrToken ?? undefined,
        b._count?.jugadores,
        b.liderId ?? undefined,
        b.lider?.alias ?? undefined,
        escuadras,
        b.frecuenciaRadio ?? undefined,
        b.subtonoRadio ?? undefined,
        b.cupoMax ?? undefined,
      );
    });

    const jugadoresInscritos = raw.jugadores?.map((j: any) => ({
      jugadorId: j.jugadorId,
      bandoId: j.bandoId,
      escuadraId: j.escuadraId,
      rol: j.rol,
    }));

    const coorganizadores = raw.organizadores?.map((o: any) => ({
      jugadorId: o.jugadorId,
      alias: o.jugador?.alias,
    }));

    const tacsop = raw.tacsop
      ? {
          id: raw.tacsop.id,
          eventoId: raw.tacsop.eventoId,
          presetTipo: raw.tacsop.presetTipo,
          vidasMax: raw.tacsop.vidasMax,
          requiereTorniquete: raw.tacsop.requiereTorniquete,
          torniquetesPorJugador: raw.tacsop.torniquetesPorJugador,
          tiempoDesangradoMin: raw.tacsop.tiempoDesangradoMin,
          soloMedicoRevive: raw.tacsop.soloMedicoRevive,
          requierePanueloRojo: raw.tacsop.requierePanueloRojo,
          luzRojaNocturna: raw.tacsop.luzRojaNocturna,
          tipoCargadores: raw.tacsop.tipoCargadores,
          limiteMunicionBbs: raw.tacsop.limiteMunicionBbs,
          pirotecniaPermitida: raw.tacsop.pirotecniaPermitida,
          humoFrioPermitido: raw.tacsop.humoFrioPermitido,
          limitesCrono: raw.tacsop.limitesCrono,
          frecuenciaEmergencia: raw.tacsop.frecuenciaEmergencia,
          frecuenciaStaff: raw.tacsop.frecuenciaStaff,
          subtonoStaff: raw.tacsop.subtonoStaff,
          reglasAdicionales: raw.tacsop.reglasAdicionales,
        }
      : null;

    const fases = raw.fases?.map((f: any) => ({
      id: f.id,
      eventoId: f.eventoId,
      orden: f.orden,
      nombre: f.nombre,
      descripcion: f.descripcion,
      horaInicio: f.horaInicio,
      horaFin: f.horaFin,
      esFaseCrono: f.esFaseCrono,
      activa: f.activa,
      completada: f.completada,
    }));

    const registrosCrono = raw.registrosCrono?.map((r: any) => ({
      id: r.id,
      eventoId: r.eventoId,
      jugadorId: r.jugadorId,
      tipoReplica: r.tipoReplica,
      categoria: r.categoria,
      modelo: r.modelo,
      joules: r.joules,
      fps: r.fps,
      gramajeBb: r.gramajeBb,
      aprobado: r.aprobado,
      notas: r.notas,
      cronoPorId: r.cronoPorId,
      createdAt: r.createdAt,
      jugadorAlias: r.jugador?.alias,
    }));

    const misiones = raw.misiones?.map((m: any) => ({
      id: m.id,
      eventoId: m.eventoId,
      bandoId: m.bandoId,
      titulo: m.titulo,
      descripcionLider: m.descripcionLider,
      descripcionOperadores: m.descripcionOperadores,
      fotoUrl: m.fotoUrl ?? null,
      estado: m.estado || 'ACTIVA',
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      bandoNombre: m.bando?.nombre,
      bandoColorHex: m.bando?.colorHex,
    }));

    return new Evento(
      raw.id,
      raw.titulo,
      raw.tipo,
      raw.privacidad,
      raw.canchaId,
      raw.organizadorId,
      raw.estado,
      raw.descripcion ?? undefined,
      raw.fechaInicio ?? undefined,
      raw.fechaFin ?? undefined,
      raw.region ?? undefined,
      raw.ciudad ?? undefined,
      raw.equipoAId ?? undefined,
      raw.equipoBId ?? undefined,
      raw.codigoInvitacion ?? undefined,
      bandos,
      raw.cancha?.nombre,
      raw.organizador?.alias,
      jugadoresInscritos,
      raw.motivoCancelacion ?? undefined,
      raw.inscripcionesAbiertas ?? true,
      coorganizadores,
      raw.latitud ? Number(raw.latitud) : null,
      raw.longitud ? Number(raw.longitud) : null,
      raw.direccionTexto ?? null,
      raw.mapaTacticoUrl ?? null,
      raw.mapaPines ?? null,
      tacsop,
      fases,
      registrosCrono,
      misiones,
    );
  }
}
