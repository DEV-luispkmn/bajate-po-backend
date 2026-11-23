import { IsInt, IsNotEmpty } from 'class-validator';

export class VotarMvpDto {
  @IsInt()
  @IsNotEmpty()
  candidatoId: number;
}
