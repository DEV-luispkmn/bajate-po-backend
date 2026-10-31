import { Partida, Ronda, EstadoPartida } from './partida.entity';

export const PARTIDA_REPOSITORY = Symbol('PARTIDA_REPOSITORY');

export interface CrearPartidaData {
  eventoId: number;
  nombre?: string;
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
  findByEventoId(eventoId: number): Promise<Partida[]>;
  actualizarEstado(partidaId: number, estado: EstadoPartida): Promise<Partida>;
  registrarRonda(data: RegistrarRondaData): Promise<Ronda>;
  sincronizarRondas(rondas: RegistrarRondaData[]): Promise<Ronda[]>;
  obtenerRondasDePartida(partidaId: number): Promise<Ronda[]>;
}
