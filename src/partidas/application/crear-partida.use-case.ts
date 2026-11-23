import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PARTIDA_REPOSITORY } from '../domain/partida.repository.interface';
import type { IPartidaRepository } from '../domain/partida.repository.interface';
import { EVENTO_REPOSITORY } from '../../eventos/domain/evento.repository.interface';
import type { IEventoRepository } from '../../eventos/domain/evento.repository.interface';
import { NotificacionesService } from '../../notificaciones/notificaciones.service';
import { CrearPartidaDto } from './crear-partida.dto';
import { Partida } from '../domain/partida.entity';

@Injectable()
export class CrearPartidaUseCase {
  constructor(
    @Inject(PARTIDA_REPOSITORY)
    private readonly partidaRepository: IPartidaRepository,
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
    @Optional()
    private readonly notificacionesService?: NotificacionesService,
  ) {}

  async execute(dto: CrearPartidaDto, jugadorId?: number): Promise<Partida> {
    const evento = await this.eventoRepository.findById(dto.eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento con ID ${dto.eventoId} no existe`);
    }

    if (jugadorId !== undefined && evento.organizadorId !== jugadorId) {
      throw new ForbiddenException('Solo el creador u organizador del evento puede añadir partidas');
    }

    if (evento.estado === 'FINALIZADO' || evento.estado === 'CANCELADO') {
      throw new BadRequestException('No se pueden añadir nuevas partidas a un evento que ya está finalizado o cancelado');
    }

    // Validación de quórum mínimo para iniciar partida
    const jugadoresInscritos = evento.jugadoresInscritos || [];
    if (jugadoresInscritos.length < 2) {
      throw new BadRequestException(
        'No se puede iniciar la partida: se requieren al menos 2 jugadores inscritos en el evento.',
      );
    }

    if (evento.tipo === 'VERSUS' || evento.tipo === 'EVENTO_MASIVO') {
      const bandos = evento.bandos || [];
      if (bandos.length >= 2) {
        const hayBandoVacio = bandos.some((bando) => {
          const count = jugadoresInscritos.filter((j) => j.bandoId === bando.id).length;
          return count < 1;
        });
        if (hayBandoVacio) {
          throw new BadRequestException(
            'No se puede iniciar la partida: en un Versus o Evento Masivo debe haber al menos 1 jugador inscrito en cada bando.',
          );
        }
      }
    }

    // Si el evento estaba PROGRAMADO, al crear la partida pasa a estar EN_CURSO
    if (evento.estado === 'PROGRAMADO') {
      await this.eventoRepository.actualizarEstado(dto.eventoId, 'EN_CURSO');
      if (this.notificacionesService) {
        for (const j of jugadoresInscritos) {
          if (j.jugadorId !== jugadorId) {
            await this.notificacionesService
              .crear({
                jugadorId: j.jugadorId,
                titulo: '🎯 ¡Operación Iniciada!',
                mensaje: `El combate en "${evento.titulo}" acaba de dar inicio. ¡Únete a la partida!`,
                tipo: 'EVENTO_INICIADO',
                link: JSON.stringify({
                  tipo: 'EVENTO_INICIADO',
                  eventoId: evento.id,
                  titulo: evento.titulo,
                  screen: 'EventoDetalle',
                  params: { eventoId: evento.id },
                }),
              })
              .catch(() => null);
          }
        }
      }
    }

    // Copiar la alineación de combate actual a esta partida para guardar el registro histórico
    const jugadoresParaPartida = (evento.jugadoresInscritos || [])
      .filter((j) => j.bandoId !== null && j.bandoId !== undefined)
      .map((j) => ({
        jugadorId: j.jugadorId,
        bandoId: j.bandoId as number,
        rol: j.rol || 'ASALTO',
      }));

    return this.partidaRepository.create({
      eventoId: dto.eventoId,
      nombre: dto.nombre ?? 'Partida Principal',
      modalidadId: dto.modalidadId,
      modalidadNombre: dto.modalidadNombre,
      jugadores: jugadoresParaPartida,
    });
  }
}
