export type EstadoPartida = 'PENDIENTE' | 'EN_CURSO' | 'FINALIZADA';
export type EstadoSync = 'PENDIENTE_SYNC' | 'SINCRONIZADO';

export class Ronda {
  constructor(
    public readonly id: number,
    public readonly partidaId: number,
    public readonly numeroRonda: number,
    public readonly bandoGanadorId?: number,
    public readonly estadoSync: EstadoSync = 'SINCRONIZADO',
    public readonly fechaRegistro: Date = new Date(),
    public readonly bandoGanadorNombre?: string,
  ) {}
}

export class Partida {
  constructor(
    public readonly id: number,
    public readonly eventoId: number,
    public readonly estado: EstadoPartida,
    public readonly nombre?: string,
    public readonly rondas?: Ronda[],
    public readonly marcador?: Record<number, number>, // bandoId -> rondasGanadas
  ) {}
}
