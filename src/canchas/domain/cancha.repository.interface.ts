import { Cancha } from './cancha.entity';

export const CANCHA_REPOSITORY = Symbol('CANCHA_REPOSITORY');

export interface ICanchaRepository {
  create(data: Omit<Cancha, 'id'>): Promise<Cancha>;
  findById(id: number): Promise<Cancha | null>;
  findAll(): Promise<Cancha[]>;
}
