import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum EstadoCanchaAdmin {
  EN_REVISION = 'EN_REVISION',
  ACTIVA = 'ACTIVA',
  RECHAZADA = 'RECHAZADA',
}

export class CambiarEstadoCanchaDto {
  @IsEnum(EstadoCanchaAdmin, { message: 'El estado debe ser EN_REVISION, ACTIVA o RECHAZADA' })
  readonly estado: EstadoCanchaAdmin;

  @IsOptional()
  @IsString()
  readonly motivo?: string;
}
