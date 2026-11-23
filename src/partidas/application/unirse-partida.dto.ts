import { IsOptional, IsInt, IsString } from 'class-validator';

export class UnirsePartidaDto {
  @IsOptional()
  @IsInt()
  bandoId?: number;

  @IsOptional()
  @IsString()
  rol?: string;
}
