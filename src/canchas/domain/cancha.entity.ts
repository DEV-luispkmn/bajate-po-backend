export interface CanchaFotoItem {
  id?: number;
  url: string;
  descripcion?: string;
}

export class Cancha {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly region?: string,
    public readonly ciudad?: string,
    public readonly latitud?: number,
    public readonly longitud?: number,
    public readonly adminEquipoId?: number,
    public readonly descripcion?: string,
    public readonly esAbierta: boolean = true,
    public readonly equipoAdminNombre?: string,
    public readonly activa: boolean = false,
    public readonly estado: 'EN_REVISION' | 'ACTIVA' | 'RECHAZADA' = 'EN_REVISION',
    public readonly creadorId?: number,
    public readonly fotos: CanchaFotoItem[] = [],
    public readonly createdAt?: Date,
    public readonly mapaTacticoUrl?: string,
  ) {}
}
