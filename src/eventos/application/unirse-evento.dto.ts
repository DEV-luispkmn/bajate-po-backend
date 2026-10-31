import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UnirseEventoDto {
  @IsString()
  @IsOptional()
  readonly qrToken?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  readonly codigoInvitacion?: string;

  @IsNumber()
  @IsOptional()
  readonly bandoId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  readonly rol?: string;
}
