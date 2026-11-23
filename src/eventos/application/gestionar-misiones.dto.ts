import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearMisionDto {
  @IsInt()
  @IsNotEmpty({ message: 'El ID de la facción/bando es obligatorio' })
  readonly bandoId: number;

  @IsString()
  @IsNotEmpty({ message: 'El título de la misión es obligatorio' })
  @MaxLength(150)
  readonly titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'El briefing para el líder de facción es obligatorio' })
  readonly descripcionLider: string;

  @IsString()
  @IsNotEmpty({ message: 'La orden general para los operadores es obligatoria' })
  readonly descripcionOperadores: string;

  @IsString()
  @IsOptional()
  readonly fotoUrl?: string;

  @IsString()
  @IsOptional()
  readonly estado?: string;
}

export class ActualizarEstadoMisionDto {
  @IsString()
  @IsNotEmpty({ message: 'El estado de la misión es obligatorio' })
  readonly estado: string;
}
