import { IsEnum } from 'class-validator';

export enum EstadoEventoDto {
  PROGRAMADO = 'PROGRAMADO',
  EN_CURSO = 'EN_CURSO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
}

export class CambiarEstadoEventoDto {
  @IsEnum(EstadoEventoDto, {
    message: 'El estado debe ser PROGRAMADO, EN_CURSO, FINALIZADO o CANCELADO',
  })
  readonly estado: EstadoEventoDto;
}
