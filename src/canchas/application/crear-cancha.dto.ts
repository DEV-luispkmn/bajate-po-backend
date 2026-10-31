import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearCanchaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la cancha es obligatorio' })
  @MaxLength(100)
  readonly nombre: string;

  @IsNumber()
  @IsOptional()
  readonly latitud?: number;

  @IsNumber()
  @IsOptional()
  readonly longitud?: number;

  @IsNumber()
  @IsOptional()
  readonly adminEquipoId?: number;
}
