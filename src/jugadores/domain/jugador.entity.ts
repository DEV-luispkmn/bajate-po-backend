export class Jugador {
  constructor(
    public readonly id: number,
    public readonly alias: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly createdAt: Date,
    public readonly rango?: string,
    public readonly avatarUrl?: string,
    public readonly equipoId?: number,
    public readonly region?: string,
    public readonly ciudad?: string,
    public readonly roles?: string,
    public readonly esAdmin?: boolean,
    public readonly fama?: number,
    public readonly mvpsGanados?: number,
  ) {}
}
