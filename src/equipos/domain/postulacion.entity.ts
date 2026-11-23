export type EstadoPostulacion = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA';

export class PostulacionEquipo {
  id: number;
  equipoId: number;
  jugadorId: number;
  mensaje?: string | null;
  contacto?: string | null;
  estado: EstadoPostulacion;
  motivoRechazo?: string | null;
  createdAt: Date;
  updatedAt?: Date;

  // Datos del jugador para el TL
  jugadorAlias?: string;
  jugadorAvatarUrl?: string | null;
  jugadorRango?: string | null;
  jugadorRegion?: string | null;
  jugadorCiudad?: string | null;
  jugadorEmail?: string;

  // Datos del equipo para el postulante
  equipoNombre?: string;
  equipoLogoUrl?: string | null;

  constructor(partial: Partial<PostulacionEquipo>) {
    Object.assign(this, partial);
    this.estado = partial.estado ?? 'PENDIENTE';
    this.createdAt = partial.createdAt ?? new Date();
  }
}
