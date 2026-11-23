import { IsInt, IsOptional } from 'class-validator';

export class DesignarLiderBandoDto {
  @IsOptional()
  @IsInt()
  jugadorId?: number | null;
}
