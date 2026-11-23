import { IsString, IsNotEmpty, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CrearEscuadraDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  cupoMax?: number = 10;

  @IsOptional()
  @IsInt()
  liderId?: number;
}

export class GenerarEscuadrasDto {
  @IsInt()
  @Min(1)
  @Max(20)
  cantidad: number;

  @IsOptional()
  @IsString()
  prefijo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  cupoMax?: number = 10;
}
