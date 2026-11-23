import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'El identificador debe ser un texto válido' })
  @IsNotEmpty({ message: 'Debes ingresar tu correo o alias' })
  readonly identificador: string;

  @IsString({ message: 'La contraseña debe ser un texto válido' })
  readonly password: string;
}
