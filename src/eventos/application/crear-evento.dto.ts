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
  IsInt,
  Min,
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

  @IsString()
  @IsOptional()
  @MaxLength(50)
  readonly frecuenciaRadio?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  readonly subtonoRadio?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  readonly cupoMax?: number;
}

export class CrearEventoDto {
  @IsString()
  @IsNotEmpty({ message: 'El título del evento es obligatorio' })
  @MaxLength(150)
  readonly titulo: string;

  @IsString()
  @IsOptional()
  readonly descripcion?: string;

  @IsEnum(TipoEventoDto, {
    message: 'El tipo debe ser PICHANGA, VERSUS, TORNEO o EVENTO_MASIVO',
  })
  readonly tipo: TipoEventoDto;

  @IsEnum(PrivacidadDto, {
    message: 'La privacidad debe ser ABIERTO o CERRADO',
  })
  readonly privacidad: PrivacidadDto;

  @IsNumber({}, { message: 'El ID de la cancha debe ser numérico' })
  @IsOptional()
  readonly canchaId?: number;

  @IsNumber()
  @IsOptional()
  readonly latitud?: number;

  @IsNumber()
  @IsOptional()
  readonly longitud?: number;

  @IsString()
  @IsOptional()
  readonly direccionTexto?: string;

  @IsString()
  @IsOptional()
  readonly mapaTacticoUrl?: string;

  @IsOptional()
  readonly mapaPines?: any;

  @IsOptional()
  readonly tacsop?: any;

  @IsOptional()
  readonly fases?: any[];

  @IsDateString({}, { message: 'La fecha de inicio debe tener formato ISO válido' })
  @IsOptional()
  readonly fechaInicio?: string;

  @IsDateString({}, { message: 'La fecha de término debe tener formato ISO válido' })
  @IsOptional()
  readonly fechaFin?: string;

  @IsString()
  @IsOptional()
  readonly region?: string;

  @IsString()
  @IsOptional()
  readonly ciudad?: string;

  @IsNumber()
  @IsOptional()
  readonly equipoAId?: number;

  @IsNumber()
  @IsOptional()
  readonly equipoBId?: number;

  @IsString()
  @IsOptional()
  readonly rolOrganizador?: string;

  @IsNumber()
  @IsOptional()
  readonly bandoOrganizadorIndex?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BandoInicialDto)
  @IsOptional()
  readonly bandos?: BandoInicialDto[];
}
