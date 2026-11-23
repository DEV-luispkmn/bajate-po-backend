import { IsInt, IsEnum, IsString, IsNotEmpty } from 'class-validator';

export const CATEGORIAS_REPORTES = [
  'INMORTAL',
  'CONFLICTIVO',
  'INFALIBLE',
  'MAL_COMPANERO',
  'NO_TRABAJA_EN_EQUIPO',
] as const;

export const CATEGORIAS_RECONOCIMIENTOS = [
  'HONESTO',
  'BUEN_COMPANERO',
  'ESTRATEGA',
  'ULTIMO_HOMBRE_EN_PIE',
] as const;

export type CategoriaReporte = typeof CATEGORIAS_REPORTES[number];
export type CategoriaReconocimiento = typeof CATEGORIAS_RECONOCIMIENTOS[number];

export class EvaluarFamaDto {
  @IsInt()
  evaluadoId: number;

  @IsEnum(['REPORTE', 'RECONOCIMIENTO'], {
    message: 'El tipo debe ser REPORTE o RECONOCIMIENTO',
  })
  tipo: 'REPORTE' | 'RECONOCIMIENTO';

  @IsString()
  @IsNotEmpty({ message: 'La categoría de la evaluación es requerida' })
  categoria: string;
}
