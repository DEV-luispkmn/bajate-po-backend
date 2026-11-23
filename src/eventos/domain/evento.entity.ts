export type TipoEvento = 'PICHANGA' | 'VERSUS' | 'TORNEO' | 'EVENTO_MASIVO';
export type Privacidad = 'ABIERTO' | 'CERRADO';
export type EstadoEvento = 'PROGRAMADO' | 'EN_CURSO' | 'FINALIZADO' | 'CANCELADO';

export class Escuadra {
  constructor(
    public readonly id: number,
    public readonly bandoId: number,
    public readonly nombre: string,
    public readonly cupoMax: number = 10,
    public readonly liderId?: number,
    public readonly liderAlias?: string,
    public readonly jugadoresCount?: number,
    public readonly frecuenciaRadio?: string,
    public readonly subtonoRadio?: string,
  ) {}
}

export class Bando {
  constructor(
    public readonly id: number,
    public readonly eventoId: number,
    public readonly nombre: string,
    public readonly colorHex?: string,
    public readonly qrToken?: string,
    public readonly jugadoresCount?: number,
    public readonly liderId?: number,
    public readonly liderAlias?: string,
    public readonly escuadras?: Escuadra[],
    public readonly frecuenciaRadio?: string,
    public readonly subtonoRadio?: string,
    public readonly cupoMax?: number,
  ) {}
}

export class JugadorEnBando {
  constructor(
    public readonly eventoId: number,
    public readonly jugadorId: number,
    public readonly bandoId?: number | null,
    public readonly rol: string = 'ASALTO',
    public readonly alias?: string,
    public readonly avatarUrl?: string,
    public readonly escuadraId?: number | null,
    public readonly escuadraNombre?: string,
    public readonly fama?: number,
  ) {}
}

export interface JugadorInscritoResumen {
  jugadorId: number;
  bandoId?: number | null;
  escuadraId?: number | null;
  rol: string;
}

export interface CoorganizadorInfo {
  jugadorId: number;
  alias?: string;
}

export interface LimiteCronoInfo {
  categoria: string;
  maxJoules: number;
  maxFps?: number;
  medMetros: number;
  tipoDisparo: string;
}

export interface EventoTacsopInfo {
  id: number;
  eventoId: number;
  presetTipo: string;
  vidasMax: number;
  requiereTorniquete: boolean;
  torniquetesPorJugador: number;
  tiempoDesangradoMin: number;
  soloMedicoRevive: boolean;
  requierePanueloRojo: boolean;
  luzRojaNocturna: string;
  tipoCargadores: string;
  limiteMunicionBbs?: number | null;
  pirotecniaPermitida: boolean;
  humoFrioPermitido: boolean;
  limitesCrono?: LimiteCronoInfo[] | null;
  frecuenciaEmergencia?: string | null;
  frecuenciaStaff?: string | null;
  subtonoStaff?: string | null;
  reglasAdicionales?: string | null;
}

export interface FaseEventoInfo {
  id: number;
  eventoId: number;
  orden: number;
  nombre: string;
  descripcion?: string | null;
  horaInicio?: Date | null;
  horaFin?: Date | null;
  esFaseCrono: boolean;
  activa: boolean;
  completada: boolean;
}

export interface RegistroCronoInfo {
  id: number;
  eventoId: number;
  jugadorId: number;
  tipoReplica: string;
  categoria: string;
  modelo?: string | null;
  joules: number;
  fps?: number | null;
  gramajeBb?: number | null;
  aprobado: boolean;
  notas?: string | null;
  cronoPorId?: number | null;
  createdAt: Date;
  jugadorAlias?: string;
}

export interface MisionEventoInfo {
  id: number;
  eventoId: number;
  bandoId: number;
  titulo: string;
  descripcionLider: string;
  descripcionOperadores: string;
  fotoUrl?: string | null;
  estado: string;
  createdAt: Date;
  updatedAt?: Date;
  bandoNombre?: string;
  bandoColorHex?: string;
}

export class Evento {
  constructor(
    public readonly id: number,
    public readonly titulo: string,
    public readonly tipo: TipoEvento,
    public readonly privacidad: Privacidad,
    public readonly canchaId: number | null | undefined,
    public readonly organizadorId: number,
    public readonly estado: EstadoEvento,
    public readonly descripcion?: string,
    public readonly fechaInicio?: Date,
    public readonly fechaFin?: Date,
    public readonly region?: string,
    public readonly ciudad?: string,
    public readonly equipoAId?: number,
    public readonly equipoBId?: number,
    public readonly codigoInvitacion?: string,
    public readonly bandos?: Bando[],
    public readonly canchaNombre?: string,
    public readonly organizadorAlias?: string,
    public readonly jugadoresInscritos?: JugadorInscritoResumen[],
    public readonly motivoCancelacion?: string,
    public readonly inscripcionesAbiertas: boolean = true,
    public readonly coorganizadores?: CoorganizadorInfo[],
    public readonly latitud?: number | null,
    public readonly longitud?: number | null,
    public readonly direccionTexto?: string | null,
    public readonly mapaTacticoUrl?: string | null,
    public readonly mapaPines?: any[] | null,
    public readonly tacsop?: EventoTacsopInfo | null,
    public readonly fases?: FaseEventoInfo[],
    public readonly registrosCrono?: RegistroCronoInfo[],
    public readonly misiones?: MisionEventoInfo[],
  ) {}
}
