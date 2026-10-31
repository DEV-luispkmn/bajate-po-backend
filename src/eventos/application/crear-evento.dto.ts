import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoEventoDto {
  PICHANGA = 'PICHANGA',
  VERSUS = 'VERSUS',
  TORNEO = 'TORNEO',
  EVENTO_MASIVO = 'EVENTO_MASIVO',
}

export enum PrivacidadDto {
  ABIERTO = 'ABIERTO',
  CERRADO = 'CERRADO',
}

export class BandoInicialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly nombre: string;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  readonly colorHex?: string;
}

export class CrearEventoDto {
  @IsString()
  @IsNotEmpty({ message: 'El título del evento es obligatorio' })
  @MaxLength(150)
  readonly titulo: string;

  @IsEnum(TipoEventoDto, {
    message: 'El tipo debe ser PICHANGA, VERSUS, TORNEO o EVENTO_MASIVO',
  })
  readonly tipo: TipoEventoDto;

  @IsEnum(PrivacidadDto, {
    message: 'La privacidad debe ser ABIERTO o CERRADO',
  })
  readonly privacidad: PrivacidadDto;

  @IsNumber({}, { message: 'El ID de la cancha debe ser numérico' })
  readonly canchaId: number;

  @IsDateString({}, { message: 'La fecha de inicio debe tener formato ISO válido' })
  @IsOptional()
  readonly fechaInicio?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BandoInicialDto)
  @IsOptional()
  readonly bandos?: BandoInicialDto[];
}
