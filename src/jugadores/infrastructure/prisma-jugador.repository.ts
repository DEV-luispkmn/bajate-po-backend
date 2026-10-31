import { Injectable } from '@nestjs/common';
import { IJugadorRepository } from '../domain/jugador.repository.interface';
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
        rango: data.rango,
        avatarUrl: data.avatarUrl,
        equipoId: data.equipoId,
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
    );
  }
}
