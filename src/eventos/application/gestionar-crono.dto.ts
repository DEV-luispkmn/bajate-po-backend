import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegistrarCronoReplicaDto {
  @IsNumber({}, { message: 'El ID del jugador es obligatorio' })
  readonly jugadorId: number;

  @IsString()
  @IsOptional()
  readonly tipoReplica?: string; // PRIMARIA, PRIMARIA_2, SECUNDARIA, RESPALDO

  @IsString()
  @IsNotEmpty({ message: 'La categoría de réplica es obligatoria' })
  @MaxLength(50)
  readonly categoria: string; // ASALTO, DMR, SNIPER, SOPORTE, PISTOLA

  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly modelo?: string;

  @IsNumber({}, { message: 'La medición de Joules es obligatoria' })
  readonly joules: number;

  @IsNumber()
  @IsOptional()
  readonly fps?: number;

  @IsNumber()
  @IsOptional()
  readonly gramajeBb?: number;

  @IsBoolean()
  @IsOptional()
  readonly aprobado?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  readonly notas?: string;
}
