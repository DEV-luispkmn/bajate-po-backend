import { IsString, IsOptional, MaxLength } from 'class-validator';

export class PostularEquipoDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly contacto?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  readonly mensaje?: string;
}
