import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'El identificador debe ser un texto válido' })
  @IsNotEmpty({ message: 'Debes ingresar tu correo o alias' })
  readonly identificador: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  readonly password: string;
}
