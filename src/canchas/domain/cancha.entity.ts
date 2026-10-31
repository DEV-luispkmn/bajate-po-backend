export class Cancha {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly latitud?: number,
    public readonly longitud?: number,
    public readonly adminEquipoId?: number,
  ) {}
}
