import { IsEnum } from 'class-validator';

export enum EstadoPartidaDto {
  PENDIENTE = 'PENDIENTE',
  EN_CURSO = 'EN_CURSO',
  FINALIZADA = 'FINALIZADA',
}

export class CambiarEstadoPartidaDto {
  @IsEnum(EstadoPartidaDto, {
    message: 'El estado debe ser PENDIENTE, EN_CURSO o FINALIZADA',
  })
  readonly estado: EstadoPartidaDto;
}
