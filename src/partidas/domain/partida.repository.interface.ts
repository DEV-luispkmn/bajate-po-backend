import { Partida, Ronda, EstadoPartida, JugadorPartidaInfo, MvpInfo } from './partida.entity';

export const PARTIDA_REPOSITORY = Symbol('PARTIDA_REPOSITORY');

export interface CrearPartidaData {
  eventoId: number;
  nombre?: string;
  modalidadId?: number;
  modalidadNombre?: string;
  jugadores?: { jugadorId: number; bandoId: number; rol?: string }[];
}

export interface RegistrarRondaData {
  partidaId: number;
  numeroRonda: number;
  bandoGanadorId?: number;
  fechaRegistro?: Date;
}

export interface IPartidaRepository {
  create(data: CrearPartidaData): Promise<Partida>;
  findById(id: number): Promise<Partida | null>;
  findByIdConBandos(id: number): Promise<{
    partida: Partida;
    bandos: { id: number; nombre: string; colorHex?: string }[];
    organizadorId: number;
    tituloEvento: string;
    jugadores?: JugadorPartidaInfo[];
  } | null>;
  findByEventoId(eventoId: number): Promise<Partida[]>;
  actualizarEstado(partidaId: number, estado: EstadoPartida): Promise<Partida>;
  registrarRonda(data: RegistrarRondaData): Promise<Ronda>;
  sincronizarRondas(rondas: RegistrarRondaData[]): Promise<Ronda[]>;
  obtenerRondasDePartida(partidaId: number): Promise<Ronda[]>;
  obtenerJugadoresDePartida(partidaId: number): Promise<JugadorPartidaInfo[]>;
  asignarJugadorAPartida(partidaId: number, jugadorId: number, bandoId: number, rol?: string): Promise<void>;
  obtenerMvpsDePartida(partidaId: number): Promise<MvpInfo[]>;
  registrarVotoMvp(partidaId: number, votanteId: number, candidatoId: number, bandoId: number): Promise<void>;
  haVotadoMvp(partidaId: number, votanteId: number): Promise<boolean>;
}
