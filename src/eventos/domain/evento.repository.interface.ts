import { Evento, Bando, Escuadra, JugadorEnBando, EstadoEvento, TipoEvento, Privacidad } from './evento.entity';

export const EVENTO_REPOSITORY = Symbol('EVENTO_REPOSITORY');

export interface CrearEventoData {
  titulo: string;
  tipo: TipoEvento;
  privacidad: Privacidad;
  canchaId?: number | null;
  latitud?: number | null;
  longitud?: number | null;
  direccionTexto?: string | null;
  mapaTacticoUrl?: string | null;
  mapaPines?: any;
  organizadorId: number;
  descripcion?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  region?: string;
  ciudad?: string;
  equipoAId?: number;
  equipoBId?: number;
  codigoInvitacion: string;
  bandos: {
    nombre: string;
    colorHex?: string;
    qrToken: string;
    cupoMax?: number | null;
    frecuenciaRadio?: string;
    subtonoRadio?: string;
  }[];
  rolOrganizador?: string;
  bandoOrganizadorIndex?: number;
  inscripcionesAbiertas?: boolean;
}

export interface ModificarEventoData {
  titulo?: string;
  descripcion?: string;
  canchaId?: number | null;
  latitud?: number | null;
  longitud?: number | null;
  direccionTexto?: string | null;
  mapaTacticoUrl?: string | null;
  mapaPines?: any;
  fechaInicio?: Date;
  fechaFin?: Date;
  region?: string;
  ciudad?: string;
  estado?: EstadoEvento;
  inscripcionesAbiertas?: boolean;
}

export interface FiltrosListarEventos {
  estado?: EstadoEvento;
  tipo?: TipoEvento;
  privacidad?: Privacidad;
  region?: string;
  jugadorId?: number;
}

export interface IEventoRepository {
  create(data: CrearEventoData): Promise<Evento>;
  findById(id: number): Promise<Evento | null>;
  findByCodigoInvitacion(codigo: string): Promise<Evento | null>;
  findBandoByQrToken(qrToken: string): Promise<Bando | null>;
  findAll(filtros?: FiltrosListarEventos): Promise<Evento[]>;
  unirJugadorABando(
    eventoId: number,
    jugadorId: number,
    bandoId?: number | null,
    rol?: string,
  ): Promise<JugadorEnBando>;
  obtenerJugadoresDeEvento(eventoId: number): Promise<JugadorEnBando[]>;
  desinscribirJugador(eventoId: number, jugadorId: number): Promise<void>;
  actualizarEstado(
    eventoId: number,
    nuevoEstado: EstadoEvento,
    motivoCancelacion?: string,
  ): Promise<Evento>;
  modificar(id: number, data: ModificarEventoData): Promise<Evento>;
  eliminar(id: number): Promise<void>;
  listarEquipos(): Promise<{ id: number; nombre: string; logoUrl?: string | null }[]>;
  findJugadorEquipoId(jugadorId: number): Promise<number | null>;
  cancelarEventosVencidos?(): Promise<number>;

  // Métodos para Facciones, Escuadras y Co-organizadores
  actualizarInscripciones?(eventoId: number, abiertas: boolean): Promise<Evento>;
  designarLiderBando?(bandoId: number, liderId: number | null): Promise<void>;
  crearEscuadra?(bandoId: number, nombre: string, cupoMax?: number, liderId?: number): Promise<Escuadra>;
  eliminarEscuadra?(escuadraId: number): Promise<void>;
  obtenerEscuadra?(escuadraId: number): Promise<any | null>;
  asignarEscuadraJugador?(eventoId: number, jugadorId: number, escuadraId: number | null): Promise<void>;
  agregarCoorganizador?(eventoId: number, jugadorId: number): Promise<void>;
  removerCoorganizador?(eventoId: number, jugadorId: number): Promise<void>;
  esOrganizador?(eventoId: number, jugadorId: number): Promise<boolean>;

  // Métodos para TACSOP, Fases y Cronometraje
  guardarTacsop?(eventoId: number, tacsop: any): Promise<any>;
  crearFase?(eventoId: number, datos: any): Promise<any>;
  actualizarFase?(faseId: number, datos: any): Promise<any>;
  eliminarFase?(faseId: number): Promise<void>;
  activarFase?(eventoId: number, faseId: number): Promise<void>;
  registrarCronoReplica?(datos: any): Promise<any>;
  eliminarRegistroCrono?(cronoId: number): Promise<void>;
  registrarReplicasDeclaradas?(eventoId: number, jugadorId: number, replicas: any[]): Promise<void>;
  actualizarCommsBando?(bandoId: number, frecuenciaRadio?: string, subtonoRadio?: string): Promise<void>;
  actualizarCommsEscuadra?(escuadraId: number, frecuenciaRadio?: string, subtonoRadio?: string): Promise<void>;
  actualizarMapaTactico?(eventoId: number, mapaTacticoUrl?: string, mapaPines?: any): Promise<void>;

  // Métodos para Misiones Tácticas
  crearMision?(eventoId: number, datos: any): Promise<any>;
  actualizarEstadoMision?(misionId: number, estado: string): Promise<any>;
  eliminarMision?(misionId: number): Promise<void>;
}
