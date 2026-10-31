import { IsNumber, IsOptional, IsDateString } from 'class-validator';

export class RegistrarRondaDto {
  @IsNumber({}, { message: 'El número de ronda debe ser numérico' })
  readonly numeroRonda: number;

  @IsNumber({}, { message: 'El ID del bando ganador debe ser numérico' })
  @IsOptional()
  readonly bandoGanadorId?: number;

  @IsDateString({}, { message: 'La fecha de registro debe tener formato ISO válido' })
  @IsOptional()
  readonly fechaRegistro?: string;
}
