import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ModificarEventoDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  readonly titulo?: string;

  @IsString()
  @IsOptional()
  readonly descripcion?: string;

  @IsNumber()
  @IsOptional()
  readonly canchaId?: number;

  @IsDateString()
  @IsOptional()
  readonly fechaInicio?: string;

  @IsDateString()
  @IsOptional()
  readonly fechaFin?: string;

  @IsString()
  @IsOptional()
  readonly region?: string;

  @IsString()
  @IsOptional()
  readonly ciudad?: string;

  @IsOptional()
  readonly tacsop?: any;
}
