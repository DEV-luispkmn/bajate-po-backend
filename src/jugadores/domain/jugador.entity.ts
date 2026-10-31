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
  ) {}
}