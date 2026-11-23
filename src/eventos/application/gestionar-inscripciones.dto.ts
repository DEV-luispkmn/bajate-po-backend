import { IsBoolean } from 'class-validator';

export class GestionarInscripcionesDto {
  @IsBoolean()
  abiertas: boolean;
}
