import { IsEnum, IsString, MinLength } from 'class-validator';
import { EstadoTicket } from '@prisma/client';

export class ResponderTicketDto {
  @IsEnum(EstadoTicket, { message: 'El estado debe ser PENDIENTE, EN_REVISION, RESPONDIDO o CERRADO' })
  readonly estado: EstadoTicket;

  @IsString({ message: 'La respuesta del staff debe ser un texto' })
  @MinLength(3, { message: 'La respuesta debe tener al menos 3 caracteres' })
  readonly respuestaAdmin: string;
}
