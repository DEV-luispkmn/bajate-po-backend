import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearFaseDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la fase es obligatorio' })
  @MaxLength(100)
  readonly nombre: string;

  @IsString()
  @IsOptional()
  readonly descripcion?: string;

  @IsInt()
  @IsOptional()
  readonly orden?: number;

  @IsDateString()
  @IsOptional()
  readonly horaInicio?: string;

  @IsDateString()
  @IsOptional()
  readonly horaFin?: string;

  @IsBoolean()
  @IsOptional()
  readonly esFaseCrono?: boolean;

  @IsBoolean()
  @IsOptional()
  readonly activa?: boolean;
}

export class ActualizarFaseDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly nombre?: string;

  @IsString()
  @IsOptional()
  readonly descripcion?: string;

  @IsDateString()
  @IsOptional()
  readonly horaInicio?: string;

  @IsDateString()
  @IsOptional()
  readonly horaFin?: string;

  @IsBoolean()
  @IsOptional()
  readonly esFaseCrono?: boolean;

  @IsBoolean()
  @IsOptional()
  readonly activa?: boolean;

  @IsBoolean()
  @IsOptional()
  readonly completada?: boolean;
}
