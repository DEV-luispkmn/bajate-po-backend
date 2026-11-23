import { IsBoolean } from 'class-validator';

export class ToggleAdminDto {
  @IsBoolean({ message: 'esAdmin debe ser un valor booleano' })
  readonly esAdmin: boolean;
}
