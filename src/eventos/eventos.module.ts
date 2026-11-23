import { Module } from '@nestjs/common';
import { EventosController } from './infrastructure/eventos.controller';
import { CrearEventoUseCase } from './application/crear-evento.use-case';
import { ListarEventosUseCase } from './application/listar-eventos.use-case';
import { ObtenerEventoUseCase } from './application/obtener-evento.use-case';
import { UnirseEventoUseCase } from './application/unirse-evento.use-case';
import { DesinscribirseEventoUseCase } from './application/desinscribirse-evento.use-case';
import { CambiarEstadoEventoUseCase } from './application/cambiar-estado-evento.use-case';
import { ModificarEventoUseCase } from './application/modificar-evento.use-case';
import { EliminarEventoUseCase } from './application/eliminar-evento.use-case';
import { GestionarInscripcionesUseCase } from './application/gestionar-inscripciones.use-case';
import { DesignarLiderBandoUseCase } from './application/designar-lider-bando.use-case';
import { GestionarEscuadrasUseCase } from './application/gestionar-escuadras.use-case';
import { UnirseEscuadraUseCase } from './application/unirse-escuadra.use-case';
import { GestionarCoorganizadoresUseCase } from './application/gestionar-coorganizadores.use-case';
import { GestionarTacsopUseCase } from './application/gestionar-tacsop.use-case';
import { GestionarFasesUseCase } from './application/gestionar-fases.use-case';
import { GestionarCronoUseCase } from './application/gestionar-crono.use-case';
import { GestionarMisionesUseCase } from './application/gestionar-misiones.use-case';
import { EVENTO_REPOSITORY } from './domain/evento.repository.interface';
import { PrismaEventoRepository } from './infrastructure/prisma-evento.repository';
import { CanchasModule } from '../canchas/canchas.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [CanchasModule, NotificacionesModule],
  controllers: [EventosController],
  providers: [
    CrearEventoUseCase,
    ListarEventosUseCase,
    ObtenerEventoUseCase,
    UnirseEventoUseCase,
    DesinscribirseEventoUseCase,
    CambiarEstadoEventoUseCase,
    ModificarEventoUseCase,
    EliminarEventoUseCase,
    GestionarInscripcionesUseCase,
    DesignarLiderBandoUseCase,
    GestionarEscuadrasUseCase,
    UnirseEscuadraUseCase,
    GestionarCoorganizadoresUseCase,
    GestionarTacsopUseCase,
    GestionarFasesUseCase,
    GestionarCronoUseCase,
    GestionarMisionesUseCase,
    {
      provide: EVENTO_REPOSITORY,
      useClass: PrismaEventoRepository,
    },
  ],
  exports: [EVENTO_REPOSITORY],
})
export class EventosModule {}
