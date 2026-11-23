import { IsNumber, IsOptional, IsString, MaxLength, IsArray, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReplicaDeclaradaDto {
  @IsString()
  @IsIn(['PRIMARIA', 'PRIMARIA_2', 'SECUNDARIA', 'RESPALDO'])
  readonly tipoReplica: string;

  @IsString()
  @MaxLength(50)
  readonly categoria: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly modelo?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly fpsEstimado?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly joulesEstimados?: number;
}

export class UnirseEventoDto {
  @IsNumber()
  @IsOptional()
  readonly eventoId?: number;

  @IsString()
  @IsOptional()
  readonly qrToken?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  readonly codigoInvitacion?: string;

  @IsNumber()
  @IsOptional()
  readonly bandoId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly rol?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReplicaDeclaradaDto)
  @IsOptional()
  readonly replicas?: ReplicaDeclaradaDto[];
}
