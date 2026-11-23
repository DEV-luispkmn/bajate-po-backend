export interface MiembroEquipoResumen {
  id: number;
  alias: string;
  avatarUrl?: string | null;
  rango?: string | null;
  roles?: string | null;
  esCapitan: boolean;
  esTL: boolean;
  esFundador: boolean;
}

export class Equipo {
  id: number;
  nombre: string;
  lema?: string | null;
  descripcion?: string | null;
  logoUrl?: string | null;
  region?: string | null;
  ciudad?: string | null;
  capitanId?: number | null;
  capitanAlias?: string | null;
  fundadorId?: number | null;
  fundadorAlias?: string | null;
  tlId?: number | null;
  tlAlias?: string | null;
  postulacionesAbiertas: boolean;
  activo: boolean;
  codigoAcceso?: string | null;
  fechaFundacion?: Date | null;
  createdAt: Date;
  totalMiembros: number;
  miembros?: MiembroEquipoResumen[];

  constructor(partial: Partial<Equipo>) {
    Object.assign(this, partial);
    this.totalMiembros = partial.totalMiembros ?? 0;
    this.postulacionesAbiertas = partial.postulacionesAbiertas ?? true;
    this.activo = partial.activo ?? true;
    this.createdAt = partial.createdAt ?? new Date();
  }
}
