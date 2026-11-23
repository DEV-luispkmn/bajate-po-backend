import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export enum TipoTicketDto {
  IDEA = 'IDEA',
  SUGERENCIA = 'SUGERENCIA',
  PROBLEMA = 'PROBLEMA',
  CANCHA = 'CANCHA',
  OTRO = 'OTRO',
}

export class CrearTicketDto {
  @IsEnum(TipoTicketDto, { message: 'El tipo de ticket debe ser válido' })
  @IsNotEmpty()
  readonly tipo: TipoTicketDto;

  @IsString()
  @IsNotEmpty({ message: 'El título no puede estar vacío' })
  @MaxLength(150)
  readonly titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'El mensaje no puede estar vacío' })
  readonly mensaje: string;
}

export class ActualizarNotificacionesDto {
  readonly recibeNotificaciones: boolean;
}
