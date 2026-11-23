import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ModificarCanchaDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly nombre?: string;

  @IsString()
  @IsOptional()
  readonly descripcion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly region?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly ciudad?: string;

  @IsNumber()
  @IsOptional()
  readonly latitud?: number;

  @IsNumber()
  @IsOptional()
  readonly longitud?: number;

  @IsBoolean()
  @IsOptional()
  readonly esAbierta?: boolean;

  @IsNumber()
  @IsOptional()
  readonly adminEquipoId?: number;
}
