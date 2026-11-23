import { Jugador } from './jugador.entity';

export const JUGADOR_REPOSITORY = Symbol('JUGADOR_REPOSITORY');

export interface PartidaHistorialItem {
  id: number;
  eventoId: number;
  tituloEvento: string;
  canchaNombre: string;
  fecha: Date;
  rol: string;
  bandoNombre: string;
  resultado: 'VICTORIA' | 'DERROTA' | 'EMPATE' | 'EN_JUEGO';
  marcador: string;
}

export interface PerfilCompleto {
  id: number;
  alias: string;
  email: string;
  rango: string;
  avatarUrl: string;
  region?: string | null;
  ciudad?: string | null;
  roles?: string | null;
  esAdmin?: boolean;
  fama?: number;
  mvpsGanados?: number;
  createdAt: Date;
  equipo: {
    id: number;
    nombre: string;
    descripcion?: string | null;
    logoUrl?: string | null;
  } | null;
  estadisticas: {
    eventosParticipados: number;
    rondasGanadas: number;
    rolPredilecto: string;
    mvpsGanados?: number;
    fama?: number;
  };
  medallas: {
    id: string;
    titulo: string;
    descripcion: string;
    icono: string;
    obtenida: boolean;
  }[];
  historialPartidas: PartidaHistorialItem[];
}

export interface IJugadorRepository {
  create(jugador: Omit<Jugador, 'id' | 'createdAt'>): Promise<Jugador>;
  findByEmail(email: string): Promise<Jugador | null>;
  findByAlias(alias: string): Promise<Jugador | null>;
  findById(id: number): Promise<Jugador | null>;
  obtenerPerfilCompleto(id: number): Promise<PerfilCompleto | null>;
  actualizarPerfil(
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
  ): Promise<Jugador>;
}
