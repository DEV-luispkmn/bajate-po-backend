import { Equipo } from './equipo.entity';
import { PostulacionEquipo, EstadoPostulacion } from './postulacion.entity';

export const EQUIPO_REPOSITORY = Symbol('EQUIPO_REPOSITORY');

export interface FiltrosListarEquipos {
  region?: string;
  search?: string;
}

export interface IEquipoRepository {
  crear(equipo: Partial<Equipo>, creadorId: number): Promise<Equipo>;
  modificar(id: number, datos: Partial<Equipo>): Promise<Equipo>;
  buscarPorId(id: number): Promise<Equipo | null>;
  buscarPorCodigo(codigo: string): Promise<Equipo | null>;
  listar(filtros?: FiltrosListarEquipos): Promise<Equipo[]>;
  obtenerMiEquipo(jugadorId: number): Promise<Equipo | null>;
  unirJugador(equipoId: number, jugadorId: number): Promise<void>;
  salirJugador(jugadorId: number): Promise<void>;
  desintegrar(equipoId: number): Promise<void>;
  cambiarEstadoPostulaciones(equipoId: number, abiertas: boolean): Promise<Equipo>;
  asignarTL(equipoId: number, nuevoTlId: number): Promise<Equipo>;
  crearPostulacion(
    equipoId: number,
    jugadorId: number,
    datos: { contacto?: string; mensaje?: string },
  ): Promise<PostulacionEquipo>;
  listarPostulaciones(
    equipoId: number,
    estado?: EstadoPostulacion,
  ): Promise<PostulacionEquipo[]>;
  buscarPostulacionPorId(id: number): Promise<PostulacionEquipo | null>;
  actualizarEstadoPostulacion(
    id: number,
    estado: EstadoPostulacion,
    motivoRechazo?: string,
  ): Promise<PostulacionEquipo>;
  obtenerPostulacionActiva(
    jugadorId: number,
    equipoId: number,
  ): Promise<PostulacionEquipo | null>;
  listarMisPostulaciones(jugadorId: number): Promise<PostulacionEquipo[]>;
}
