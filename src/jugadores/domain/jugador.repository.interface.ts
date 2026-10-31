import { Jugador } from './jugador.entity';

export const JUGADOR_REPOSITORY = Symbol('JUGADOR_REPOSITORY');

export interface IJugadorRepository {
  create(jugador: Omit<Jugador, 'id' | 'createdAt'>): Promise<Jugador>;
  findByEmail(email: string): Promise<Jugador | null>;
  findByAlias(alias: string): Promise<Jugador | null>;
  findById(id: number): Promise<Jugador | null>;
}
