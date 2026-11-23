import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PARTIDA_REPOSITORY } from '../domain/partida.repository.interface';
import type { IPartidaRepository } from '../domain/partida.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EvaluarFamaDto,
  CATEGORIAS_REPORTES,
  CATEGORIAS_RECONOCIMIENTOS,
} from './evaluar-fama.dto';

@Injectable()
export class EvaluarFamaUseCase {
  constructor(
    @Inject(PARTIDA_REPOSITORY)
    private readonly partidaRepository: IPartidaRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(partidaId: number, evaluadorId: number, dto: EvaluarFamaDto) {
    const { evaluadoId, tipo, categoria } = dto;

    if (evaluadorId === evaluadoId) {
      throw new BadRequestException('No puedes evaluarte a ti mismo');
    }

    // Validar categoría según el tipo
    if (tipo === 'REPORTE' && !CATEGORIAS_REPORTES.includes(categoria as any)) {
      throw new BadRequestException(
        `Categoría de reporte inválida. Opciones: ${CATEGORIAS_REPORTES.join(', ')}`,
      );
    }
    if (tipo === 'RECONOCIMIENTO' && !CATEGORIAS_RECONOCIMIENTOS.includes(categoria as any)) {
      throw new BadRequestException(
        `Categoría de reconocimiento inválida. Opciones: ${CATEGORIAS_RECONOCIMIENTOS.join(', ')}`,
      );
    }

    const partida = await this.partidaRepository.findById(partidaId);
    if (!partida) {
      throw new NotFoundException(`La partida con ID ${partidaId} no existe`);
    }

    // Verificar si ya evaluó a este operador en esta partida
    const yaEvaluado = await this.prisma.evaluacionFama.findUnique({
      where: {
        partidaId_evaluadorId_evaluadoId: {
          partidaId,
          evaluadorId,
          evaluadoId,
        },
      },
    });

    if (yaEvaluado) {
      throw new BadRequestException('Ya has evaluado a este operador en esta partida');
    }

    // Obtener combatientes de la partida
    const jugadoresPartida = await this.partidaRepository.obtenerJugadoresDePartida(partidaId);

    // Identificar bando del evaluador
    let evaluadorEnPartida = jugadoresPartida.find((j) => j.jugadorId === evaluadorId);
    if (!evaluadorEnPartida) {
      const jb = await this.prisma.jugadorBando.findUnique({
        where: { eventoId_jugadorId: { eventoId: partida.eventoId, jugadorId: evaluadorId } },
      });
      if (jb && jb.bandoId) {
        evaluadorEnPartida = {
          jugadorId: evaluadorId,
          alias: 'Evaluador',
          bandoId: jb.bandoId,
          rol: jb.rol,
        };
      }
    }

    if (!evaluadorEnPartida || !evaluadorEnPartida.bandoId) {
      throw new ForbiddenException('No participaste en esta partida para emitir evaluaciones');
    }

    // Identificar bando del evaluado
    let evaluadoEnPartida = jugadoresPartida.find((j) => j.jugadorId === evaluadoId);
    if (!evaluadoEnPartida) {
      const jb = await this.prisma.jugadorBando.findUnique({
        where: { eventoId_jugadorId: { eventoId: partida.eventoId, jugadorId: evaluadoId } },
      });
      if (jb && jb.bandoId) {
        evaluadoEnPartida = {
          jugadorId: evaluadoId,
          alias: 'Evaluado',
          bandoId: jb.bandoId,
          rol: jb.rol,
        };
      }
    }

    if (!evaluadoEnPartida || !evaluadoEnPartida.bandoId) {
      throw new BadRequestException('El operador evaluado no participó en este combate');
    }

    const esAliado = evaluadorEnPartida.bandoId === evaluadoEnPartida.bandoId;

    // Obtener información de equipo de ambos jugadores para aplicar el nerfeo anti-abuso/anti-troleo
    const [evaluadorJugador, evaluadoJugador] = await Promise.all([
      this.prisma.jugador.findUnique({
        where: { id: evaluadorId },
        select: { equipoId: true },
      }),
      this.prisma.jugador.findUnique({
        where: { id: evaluadoId },
        select: { equipoId: true, fama: true },
      }),
    ]);

    if (!evaluadoJugador) {
      throw new NotFoundException('El operador evaluado no fue encontrado');
    }

    const mismoEquipo = Boolean(
      evaluadorJugador?.equipoId &&
        evaluadoJugador?.equipoId &&
        evaluadorJugador.equipoId === evaluadoJugador.equipoId,
    );

    // FORMULA TÁCTICA DE FAMA:
    // Aliado: 0.05 | Enemigo: 0.07
    let baseDelta = esAliado ? 0.05 : 0.07;

    // Si son miembros del mismo equipo formal se resta 0.03 para evitar troleo o abuso de fama
    if (mismoEquipo) {
      baseDelta = Math.max(0.01, baseDelta - 0.03);
    }

    baseDelta = Number(baseDelta.toFixed(2));
    const deltaFama = tipo === 'RECONOCIMIENTO' ? baseDelta : -baseDelta;

    const famaActual = evaluadoJugador.fama ?? 0;
    const nuevaFama = Number((famaActual + deltaFama).toFixed(2));

    await this.prisma.$transaction([
      this.prisma.evaluacionFama.create({
        data: {
          partidaId,
          eventoId: partida.eventoId,
          evaluadorId,
          evaluadoId,
          tipo,
          categoria,
          esAliado,
          mismoEquipo,
          deltaFama,
        },
      }),
      this.prisma.jugador.update({
        where: { id: evaluadoId },
        data: { fama: nuevaFama },
      }),
    ]);

    return {
      mensaje:
        tipo === 'RECONOCIMIENTO'
          ? '¡Reconocimiento táctico registrado con éxito!'
          : 'Reporte de conducta registrado.',
      evaluadoId,
      tipo,
      categoria,
      esAliado,
      mismoEquipo,
      deltaFama,
      nuevaFama,
    };
  }

  async obtenerMisEvaluaciones(partidaId: number, evaluadorId: number) {
    const evaluaciones = await this.prisma.evaluacionFama.findMany({
      where: {
        partidaId,
        evaluadorId,
      },
      select: {
        id: true,
        evaluadoId: true,
        tipo: true,
        categoria: true,
        createdAt: true,
      },
    });

    return evaluaciones;
  }
}
