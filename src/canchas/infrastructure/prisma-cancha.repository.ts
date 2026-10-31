import { Injectable } from '@nestjs/common';
import { ICanchaRepository } from '../domain/cancha.repository.interface';
import { Cancha } from '../domain/cancha.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaCanchaRepository implements ICanchaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<Cancha, 'id'>): Promise<Cancha> {
    const raw = await this.prisma.cancha.create({
      data: {
        nombre: data.nombre,
        latitud: data.latitud !== undefined ? data.latitud : null,
        longitud: data.longitud !== undefined ? data.longitud : null,
        adminEquipoId: data.adminEquipoId ?? null,
      },
    });
    return this.mapToDomain(raw);
  }

  async findById(id: number): Promise<Cancha | null> {
    const raw = await this.prisma.cancha.findUnique({ where: { id } });
    return raw ? this.mapToDomain(raw) : null;
  }

  async findAll(): Promise<Cancha[]> {
    const list = await this.prisma.cancha.findMany({
      orderBy: { nombre: 'asc' },
    });
    return list.map((item) => this.mapToDomain(item));
  }

  private mapToDomain(raw: any): Cancha {
    return new Cancha(
      raw.id,
      raw.nombre,
      raw.latitud !== null && raw.latitud !== undefined ? Number(raw.latitud) : undefined,
      raw.longitud !== null && raw.longitud !== undefined ? Number(raw.longitud) : undefined,
      raw.adminEquipoId ?? undefined,
    );
  }
}
