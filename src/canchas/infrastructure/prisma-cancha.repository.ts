import { Injectable } from '@nestjs/common';
import { ICanchaRepository } from '../domain/cancha.repository.interface';
import { Cancha } from '../domain/cancha.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaCanchaRepository implements ICanchaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<Cancha, 'id' | 'fotos'> & {
      fotos?: { url: string; descripcion?: string }[];
    },
  ): Promise<Cancha> {
    const raw = await this.prisma.cancha.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        region: data.region ?? null,
        ciudad: data.ciudad ?? null,
        latitud: data.latitud !== undefined ? data.latitud : null,
        longitud: data.longitud !== undefined ? data.longitud : null,
        esAbierta: data.esAbierta !== undefined ? data.esAbierta : true,
        adminEquipoId: data.adminEquipoId ?? null,
        creadorId: data.creadorId ?? null,
        activa: false,
        estado: 'EN_REVISION',
        fotos:
          data.fotos && data.fotos.length > 0
            ? {
                create: data.fotos.map((f) => ({
                  url: f.url,
                  descripcion: f.descripcion ?? null,
                })),
              }
            : undefined,
      },
      include: {
        equipoAdmin: {
          select: { nombre: true },
        },
        fotos: true,
      },
    });

    // Registrar automáticamente en los tickets/sugerencias del jugador para que esté al tanto de la revisión
    if (data.creadorId) {
      const cantFotos = data.fotos?.length || 0;
      await this.prisma.ticketSoporte
        .create({
          data: {
            jugadorId: data.creadorId,
            tipo: 'CANCHA',
            titulo: `Propuesta de Campo: ${raw.nombre}`,
            mensaje: `Campo ingresado en periodo de revisión técnica.\n\n📍 Región: ${raw.region || 'No especificada'}${raw.ciudad ? ` • ${raw.ciudad}` : ''}\n🛡️ Modalidad: ${raw.esAbierta ? 'Abierta a la comunidad' : 'Administrada por escuadra'}\n📝 Descripción: ${raw.descripcion || 'Sin descripción'}\n📸 Evidencias: ${cantFotos} foto(s) registradas con descripciones para validación rápida.`,
          },
        })
        .catch(() => {});
    }

    return this.mapToDomain(raw);
  }

  async findById(id: number): Promise<Cancha | null> {
    const raw = await this.prisma.cancha.findUnique({
      where: { id },
      include: {
        equipoAdmin: {
          select: { nombre: true },
        },
        fotos: true,
      },
    });
    return raw ? this.mapToDomain(raw) : null;
  }

  async findAll(region?: string, regiones?: string[], usuarioId?: number): Promise<Cancha[]> {
    // Solo las canchas activadas y aprobadas se listan en el radar público
    // Las canchas en revisión técnica quedan registradas en el buzón de soporte/sugerencias del usuario
    const andConditions: any[] = [
      {
        OR: [
          { estado: 'ACTIVA' },
          { AND: [{ activa: true }, { NOT: { estado: 'EN_REVISION' } }] },
        ],
      },
    ];

    if (regiones && regiones.length > 0) {
      andConditions.push({ region: { in: regiones } });
    } else if (region && region.trim()) {
      andConditions.push({ region: region.trim() });
    }

    const list = await this.prisma.cancha.findMany({
      where: { AND: andConditions },
      include: {
        equipoAdmin: {
          select: { nombre: true },
        },
        fotos: true,
      },
      orderBy: [{ nombre: 'asc' }],
    });
    return list.map((item) => this.mapToDomain(item));
  }

  async update(id: number, data: Partial<Omit<Cancha, 'id'>>): Promise<Cancha> {
    const updateData: any = {};
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.ciudad !== undefined) updateData.ciudad = data.ciudad;
    if (data.latitud !== undefined) updateData.latitud = data.latitud;
    if (data.longitud !== undefined) updateData.longitud = data.longitud;
    if (data.esAbierta !== undefined) updateData.esAbierta = data.esAbierta;
    if (data.adminEquipoId !== undefined) updateData.adminEquipoId = data.adminEquipoId;
    if (data.activa !== undefined) updateData.activa = data.activa;
    if (data.estado !== undefined) updateData.estado = data.estado;

    const raw = await this.prisma.cancha.update({
      where: { id },
      data: updateData,
      include: {
        equipoAdmin: {
          select: { nombre: true },
        },
        fotos: true,
      },
    });
    return this.mapToDomain(raw);
  }

  private mapToDomain(raw: any): Cancha {
    return new Cancha(
      raw.id,
      raw.nombre,
      raw.region ?? undefined,
      raw.ciudad ?? undefined,
      raw.latitud !== null && raw.latitud !== undefined ? Number(raw.latitud) : undefined,
      raw.longitud !== null && raw.longitud !== undefined ? Number(raw.longitud) : undefined,
      raw.adminEquipoId ?? undefined,
      raw.descripcion ?? undefined,
      raw.esAbierta !== undefined ? Boolean(raw.esAbierta) : true,
      raw.equipoAdmin?.nombre ?? undefined,
      Boolean(raw.activa),
      raw.estado || 'ACTIVA',
      raw.creadorId ?? undefined,
      raw.fotos?.map((f: any) => ({
        id: f.id,
        url: f.url,
        descripcion: f.descripcion ?? undefined,
      })) || [],
      raw.createdAt ?? undefined,
      raw.mapaTacticoUrl ?? undefined,
    );
  }
}
