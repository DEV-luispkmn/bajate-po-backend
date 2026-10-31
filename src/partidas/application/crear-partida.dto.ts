import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearPartidaDto {
  @IsNumber({}, { message: 'El ID del evento debe ser un número' })
  @IsNotEmpty()
  readonly eventoId: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly nombre?: string;
}
