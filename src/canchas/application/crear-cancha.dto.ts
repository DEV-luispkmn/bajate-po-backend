import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FotoCanchaInputDto {
  @IsString()
  @IsNotEmpty({ message: 'La imagen o fotografía es obligatoria' })
  readonly url: string;

  @IsString()
  @IsOptional()
  readonly descripcion?: string;
}

export class CrearCanchaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la cancha es obligatorio' })
  @MaxLength(100)
  readonly nombre: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FotoCanchaInputDto)
  @IsOptional()
  readonly fotos?: FotoCanchaInputDto[];
}
