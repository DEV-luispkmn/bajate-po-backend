export type TipoEvento = 'PICHANGA' | 'VERSUS' | 'TORNEO' | 'EVENTO_MASIVO';
export type Privacidad = 'ABIERTO' | 'CERRADO';
export type EstadoEvento = 'PROGRAMADO' | 'EN_CURSO' | 'FINALIZADO' | 'CANCELADO';

export class Bando {
  constructor(
    public readonly id: number,
    public readonly eventoId: number,
    public readonly nombre: string,
    public readonly colorHex?: string,
    public readonly qrToken?: string,
    public readonly jugadoresCount?: number,
  ) {}
}

export class JugadorEnBando {
  constructor(
    public readonly eventoId: number,
    public readonly jugadorId: number,
    public readonly bandoId: number,
    public readonly rol: string,
    public readonly alias?: string,
    public readonly avatarUrl?: string,
  ) {}
}

export class Evento {
  constructor(
    public readonly id: number,
    public readonly titulo: string,
    public readonly tipo: TipoEvento,
    public readonly privacidad: Privacidad,
    public readonly canchaId: number,
    public readonly organizadorId: number,
    public readonly estado: EstadoEvento,
    public readonly fechaInicio?: Date,
    public readonly codigoInvitacion?: string,
    public readonly bandos?: Bando[],
    public readonly canchaNombre?: string,
    public readonly organizadorAlias?: string,
  ) {}
}
