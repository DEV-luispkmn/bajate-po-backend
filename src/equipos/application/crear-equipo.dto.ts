import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CrearEquipoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly nombre: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  readonly lema?: string;

  @IsString()
  @IsOptional()
  readonly descripcion?: string;

  @IsString()
  @IsOptional()
  readonly logoUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly region?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly ciudad?: string;
}
