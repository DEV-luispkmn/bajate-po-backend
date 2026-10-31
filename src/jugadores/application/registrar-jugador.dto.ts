import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegistrarJugadorDto {
  @IsString()
  @MaxLength(50)
  readonly alias: string;

  @IsEmail({}, { message: 'El formato del correo electrónico es inválido' })
  @MaxLength(100)
  readonly email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener un mínimo de 8 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe incluir mayúsculas, minúsculas y un número o carácter especial',
  })
  readonly password: string;
}