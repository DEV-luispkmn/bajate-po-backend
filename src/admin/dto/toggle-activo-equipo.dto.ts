import { IsBoolean } from 'class-validator';

export class ToggleActivoEquipoDto {
  @IsBoolean({ message: 'activo debe ser un valor booleano' })
  readonly activo: boolean;
}
