import {
  Injectable,
  Inject,
  Optional,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EQUIPO_REPOSITORY } from '../domain/equipo.repository.interface';
import type { IEquipoRepository } from '../domain/equipo.repository.interface';
import { Equipo } from '../domain/equipo.entity';
import { NotificacionesService } from '../../notificaciones/notificaciones.service';

@Injectable()
export class ExpulsarMiembroUseCase {
  constructor(
    @Inject(EQUIPO_REPOSITORY)
    private readonly equipoRepository: IEquipoRepository,
    @Optional()
    private readonly notificacionesService?: NotificacionesService,
  ) {}

  async execute(solicitanteId: number, miembroId: number): Promise<Equipo> {
    if (!solicitanteId) {
      throw new ForbiddenException('Operación no permitida: Operador no identificado.');
    }

    const miEquipo = await this.equipoRepository.obtenerMiEquipo(solicitanteId);
    if (!miEquipo) {
      throw new NotFoundException('No perteneces a ninguna escuadra.');
    }

    const esAutorizado =
      miEquipo.tlId === solicitanteId ||
      miEquipo.fundadorId === solicitanteId ||
      miEquipo.capitanId === solicitanteId;

    if (!esAutorizado) {
      throw new ForbiddenException(
        'Solo el Team Leader (TL) o el fundador pueden expulsar operadores de la escuadra.',
      );
    }

    if (miembroId === solicitanteId) {
      throw new BadRequestException(
        'No puedes expulsarte a ti mismo. Usa la opción de salir o desintegrar el equipo.',
      );
    }

    const miembroObjetivo = miEquipo.miembros?.find((m) => m.id === miembroId);
    if (!miembroObjetivo) {
      throw new BadRequestException('El operador seleccionado no pertenece a tu equipo.');
    }

    if (miEquipo.tlId === miembroId || miembroObjetivo.esTL) {
      throw new BadRequestException('No puedes expulsar al Team Leader (TL) actual del equipo.');
    }

    await this.equipoRepository.salirJugador(miembroId);

    if (this.notificacionesService) {
      await this.notificacionesService
        .crear({
          jugadorId: miembroId,
          titulo: 'Baja de Equipo',
          mensaje: `Has sido desvinculado de la escuadra "${miEquipo.nombre}". Ahora figuras como operador libre (Lobo Solitario).`,
          tipo: 'SISTEMA',
          link: JSON.stringify({
            tipo: 'EXPULSION_EQUIPO',
            equipoId: miEquipo.id,
            equipoNombre: miEquipo.nombre,
            screen: 'Equipos',
            params: { tab: 'EXPLORAR' },
          }),
        })
        .catch(() => null);
    }

    const actualizado = await this.equipoRepository.buscarPorId(miEquipo.id);
    return actualizado ?? miEquipo;
  }
}
