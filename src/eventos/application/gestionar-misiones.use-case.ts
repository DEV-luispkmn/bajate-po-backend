import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException, Optional } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import { CrearMisionDto, ActualizarEstadoMisionDto } from './gestionar-misiones.dto';
import { NotificacionesService } from '../../notificaciones/notificaciones.service';

@Injectable()
export class GestionarMisionesUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
    @Optional()
    private readonly notificacionesService?: NotificacionesService,
  ) {}

  private async validarOrganizador(eventoId: number, solicitanteId: number) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento #${eventoId} no existe`);
    }

    const esOrganizador = await this.eventoRepository.esOrganizador!(eventoId, solicitanteId);
    if (!esOrganizador) {
      throw new ForbiddenException('Solo un comandante/organizador puede gestionar las órdenes de misión.');
    }

    return evento;
  }

  async crearMision(eventoId: number, dto: CrearMisionDto, solicitanteId: number) {
    const evento = await this.validarOrganizador(eventoId, solicitanteId);

    const faseActiva = evento.fases?.find((f) => f.activa);
    if (faseActiva && faseActiva.orden >= 4) {
      throw new BadRequestException('Para la Fase 3 (Conclusión y Debriefing), las misiones ya no están activas.');
    }

    const bandoExiste = evento.bandos?.find((b) => b.id === dto.bandoId);
    if (!bandoExiste) {
      throw new NotFoundException(`La facción/bando #${dto.bandoId} no pertenece a esta operación.`);
    }

    const mision = await this.eventoRepository.crearMision!(eventoId, dto);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    // Enviar notificaciones tácticas
    if (this.notificacionesService) {
      const inscritosBando = (evento.jugadoresInscritos || []).filter(
        (j) => j.bandoId === dto.bandoId,
      );

      for (const op of inscritosBando) {
        const esLiderBando = bandoExiste.liderId === op.jugadorId;
        const tituloNotif = esLiderBando
          ? '🎖️ NUEVA ORDEN DE COMANDANCIA'
          : '🎯 NUEVA MISIÓN DE FACCIÓN';
        const mensajeNotif = esLiderBando
          ? `Misión asignada: "${dto.titulo}". Revisa el briefing clasificado de mando y coordina tus escuadras.`
          : `Nueva misión activa: "${dto.titulo}". Consulta el objetivo con tu líder de facción.`;

        this.notificacionesService
          .crear({
            jugadorId: op.jugadorId,
            titulo: tituloNotif,
            mensaje: mensajeNotif,
            tipo: 'SISTEMA',
            link: JSON.stringify({
              tipo: 'NUEVA_MISION',
              eventoId,
              misionId: mision.id,
              screen: 'EventoDetalle',
              params: { eventoId },
            }),
          })
          .catch(() => null);
      }
    }

    return {
      mensaje: `Misión "${dto.titulo}" transmitida exitosamente a ${bandoExiste.nombre}.`,
      mision,
      evento: eventoActualizado,
    };
  }

  async actualizarEstadoMision(
    eventoId: number,
    misionId: number,
    dto: ActualizarEstadoMisionDto,
    solicitanteId: number,
  ) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException(`El evento #${eventoId} no existe`);
    }

    const esOrg = await this.eventoRepository.esOrganizador!(eventoId, solicitanteId);
    const misionActual = evento.misiones?.find((m) => m.id === misionId);
    if (!misionActual) {
      throw new NotFoundException(`La misión #${misionId} no existe`);
    }

    const bando = evento.bandos?.find((b) => b.id === misionActual.bandoId);
    const esLider = bando?.liderId === solicitanteId;

    if (!esOrg && !esLider) {
      throw new ForbiddenException('Solo el comandante de la operación o el líder de facción pueden actualizar el estado de la misión.');
    }

    const misionActualizada = await this.eventoRepository.actualizarEstadoMision!(misionId, dto.estado);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: `Estado de misión actualizado a "${dto.estado}".`,
      mision: misionActualizada,
      evento: eventoActualizado,
    };
  }

  async eliminarMision(eventoId: number, misionId: number, solicitanteId: number) {
    await this.validarOrganizador(eventoId, solicitanteId);

    await this.eventoRepository.eliminarMision!(misionId);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: 'Misión eliminada del registro táctico.',
      evento: eventoActualizado,
    };
  }
}
