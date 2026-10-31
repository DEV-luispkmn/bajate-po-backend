import { Evento, Bando, JugadorEnBando, EstadoEvento, TipoEvento, Privacidad } from './evento.entity';

export const EVENTO_REPOSITORY = Symbol('EVENTO_REPOSITORY');

export interface CrearEventoData {
  titulo: string;
  tipo: TipoEvento;
  privacidad: Privacidad;
  canchaId: number;
  organizadorId: number;
  fechaInicio?: Date;
  codigoInvitacion: string;
  bandos: {
    nombre: string;
    colorHex?: string;
    qrToken: string;
  }[];
}

export interface FiltrosListarEventos {
  estado?: EstadoEvento;
  tipo?: TipoEvento;
  privacidad?: Privacidad;
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
    bandoId: number,
    rol: string,
  ): Promise<JugadorEnBando>;
  obtenerJugadoresDeEvento(eventoId: number): Promise<JugadorEnBando[]>;
  actualizarEstado(eventoId: number, nuevoEstado: EstadoEvento): Promise<Evento>;
}
