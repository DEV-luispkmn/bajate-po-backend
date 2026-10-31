import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RegistrarRondaDto } from './registrar-ronda.dto';

export class SincronizarRondasDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegistrarRondaDto)
  readonly rondas: RegistrarRondaDto[];
}
