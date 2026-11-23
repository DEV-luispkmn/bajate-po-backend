import { Injectable, Inject, NotFoundException, ForbiddenException, Optional } from '@nestjs/common';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import { CrearFaseDto, ActualizarFaseDto } from './gestionar-fases.dto';
import { NotificacionesService } from '../../notificaciones/notificaciones.service';

@Injectable()
export class GestionarFasesUseCase {
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
      throw new ForbiddenException('Solo un organizador puede gestionar el cronograma de fases.');
    }

    return evento;
  }

  async crearFase(eventoId: number, dto: CrearFaseDto, solicitanteId: number) {
    await this.validarOrganizador(eventoId, solicitanteId);

    const fase = await this.eventoRepository.crearFase!(eventoId, dto);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: `Fase "${fase.nombre}" agregada al cronograma.`,
      fase,
      evento: eventoActualizado,
    };
  }

  async actualizarFase(eventoId: number, faseId: number, dto: ActualizarFaseDto, solicitanteId: number) {
    await this.validarOrganizador(eventoId, solicitanteId);

    const fase = await this.eventoRepository.actualizarFase!(faseId, dto);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: `Fase "${fase.nombre}" actualizada.`,
      fase,
      evento: eventoActualizado,
    };
  }

  async eliminarFase(eventoId: number, faseId: number, solicitanteId: number) {
    await this.validarOrganizador(eventoId, solicitanteId);

    await this.eventoRepository.eliminarFase!(faseId);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);

    return {
      mensaje: 'Fase eliminada del cronograma.',
      evento: eventoActualizado,
    };
  }

  async activarFase(eventoId: number, faseId: number, solicitanteId: number) {
    const evento = await this.validarOrganizador(eventoId, solicitanteId);

    await this.eventoRepository.activarFase!(eventoId, faseId);
    const eventoActualizado = await this.eventoRepository.findById(eventoId);
    const faseActiva = eventoActualizado?.fases?.find((f) => f.id === faseId);

    if (faseActiva && this.notificacionesService) {
      const inscritos = evento.jugadoresInscritos || [];
      for (const j of inscritos) {
        this.notificacionesService
          .crear({
            jugadorId: j.jugadorId,
            titulo: '⏱️ CAMBIO DE FASE OPERATIVA',
            mensaje: `La operación entra en: "${faseActiva.nombre}". Consulta el TACSOP y tus COMMS asignadas.`,
            tipo: 'SISTEMA',
            link: JSON.stringify({
              tipo: 'CAMBIO_FASE',
              eventoId,
              faseId,
              screen: 'EventoDetalle',
              params: { eventoId },
            }),
          })
          .catch(() => null);
      }
    }

    const mensajeCierre =
      faseActiva && faseActiva.orden >= 4
        ? `Fase "${faseActiva.nombre}" iniciada. Las misiones de combate han finalizado y se inicia el debriefing.`
        : faseActiva && faseActiva.orden > 1
        ? `Fase "${faseActiva.nombre}" iniciada oficialmente. El evento está en curso y las inscripciones se cerraron automáticamente.`
        : `Fase "${faseActiva?.nombre || ''}" iniciada oficialmente. El evento volvió a estado programado.`;

    return {
      mensaje: mensajeCierre,
      faseActiva,
      evento: eventoActualizado,
    };
  }
}
