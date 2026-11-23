import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class GuardarTacsopDto {
  @IsString()
  @IsOptional()
  readonly presetTipo?: string; // COMBAT_MISSION, MILSIM, CUSTOM

  @IsInt()
  @IsOptional()
  readonly vidasMax?: number;

  @IsBoolean()
  @IsOptional()
  readonly requiereTorniquete?: boolean;

  @IsInt()
  @IsOptional()
  readonly torniquetesPorJugador?: number;

  @IsInt()
  @IsOptional()
  readonly tiempoDesangradoMin?: number;

  @IsBoolean()
  @IsOptional()
  readonly soloMedicoRevive?: boolean;

  @IsBoolean()
  @IsOptional()
  readonly requierePanueloRojo?: boolean;

  @IsString()
  @IsOptional()
  readonly luzRojaNocturna?: string;

  @IsString()
  @IsOptional()
  readonly tipoCargadores?: string;

  @IsInt()
  @IsOptional()
  readonly limiteMunicionBbs?: number;

  @IsBoolean()
  @IsOptional()
  readonly pirotecniaPermitida?: boolean;

  @IsBoolean()
  @IsOptional()
  readonly humoFrioPermitido?: boolean;

  @IsOptional()
  readonly limitesCrono?: any;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  readonly frecuenciaEmergencia?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  readonly frecuenciaStaff?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  readonly subtonoStaff?: string;

  @IsString()
  @IsOptional()
  readonly reglasAdicionales?: string;
}

export class ActualizarCommsDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  readonly frecuenciaRadio?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  readonly subtonoRadio?: string;
}

export class ActualizarMapaTacticoDto {
  @IsString()
  @IsOptional()
  readonly mapaTacticoUrl?: string;

  @IsOptional()
  readonly mapaPines?: any;
}
