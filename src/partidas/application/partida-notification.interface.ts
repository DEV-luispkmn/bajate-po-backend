import { Ronda, EstadoPartida } from '../domain/partida.entity';

export const PARTIDA_NOTIFICATION_SERVICE = Symbol('PARTIDA_NOTIFICATION_SERVICE');

export interface IPartidaNotificationService {
  notificarRondaRegistrada(
    partidaId: number,
    ronda: Ronda,
    marcador: Record<number, number>,
  ): void;

  notificarRondasSincronizadas(
    partidaId: number,
    rondas: Ronda[],
    marcador: Record<number, number>,
  ): void;

  notificarEstadoCambiado(
    partidaId: number,
    nuevoEstado: EstadoPartida,
  ): void;
}
