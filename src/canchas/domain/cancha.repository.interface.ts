import { Cancha } from './cancha.entity';

export const CANCHA_REPOSITORY = Symbol('CANCHA_REPOSITORY');

export interface ICanchaRepository {
  create(
    data: Omit<Cancha, 'id' | 'fotos'> & {
      fotos?: { url: string; descripcion?: string }[];
    },
  ): Promise<Cancha>;
  findById(id: number): Promise<Cancha | null>;
  findAll(region?: string, regiones?: string[], usuarioId?: number): Promise<Cancha[]>;
  update(id: number, data: Partial<Omit<Cancha, 'id'>>): Promise<Cancha>;
}
