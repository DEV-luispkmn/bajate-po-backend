import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EquiposController } from './infrastructure/equipos.controller';
import { PrismaEquipoRepository } from './infrastructure/prisma-equipo.repository';
import { EQUIPO_REPOSITORY } from './domain/equipo.repository.interface';
import { CrearEquipoUseCase } from './application/crear-equipo.use-case';
import { ListarEquiposUseCase } from './application/listar-equipos.use-case';
import { ObtenerEquipoUseCase } from './application/obtener-equipo.use-case';
import { ObtenerMiEquipoUseCase } from './application/obtener-mi-equipo.use-case';
import { UnirseEquipoUseCase } from './application/unirse-equipo.use-case';
import { SalirEquipoUseCase } from './application/salir-equipo.use-case';
import { DesintegrarEquipoUseCase } from './application/desintegrar-equipo.use-case';
import { CambiarPostulacionesUseCase } from './application/cambiar-postulaciones.use-case';
import { AsignarTLUseCase } from './application/asignar-tl.use-case';
import { ModificarEquipoUseCase } from './application/modificar-equipo.use-case';
import { PostularEquipoUseCase } from './application/postular-equipo.use-case';
import { ListarPostulacionesEquipoUseCase } from './application/listar-postulaciones-equipo.use-case';
import { ResponderPostulacionUseCase } from './application/responder-postulacion.use-case';
import { CancelarPostulacionUseCase } from './application/cancelar-postulacion.use-case';
import { ObtenerMisPostulacionesUseCase } from './application/obtener-mis-postulaciones.use-case';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [PrismaModule, NotificacionesModule],
  controllers: [EquiposController],
  providers: [
    {
      provide: EQUIPO_REPOSITORY,
      useClass: PrismaEquipoRepository,
    },
    CrearEquipoUseCase,
    ListarEquiposUseCase,
    ObtenerEquipoUseCase,
    ObtenerMiEquipoUseCase,
    UnirseEquipoUseCase,
    SalirEquipoUseCase,
    DesintegrarEquipoUseCase,
    CambiarPostulacionesUseCase,
    AsignarTLUseCase,
    ModificarEquipoUseCase,
    PostularEquipoUseCase,
    ListarPostulacionesEquipoUseCase,
    ResponderPostulacionUseCase,
    CancelarPostulacionUseCase,
    ObtenerMisPostulacionesUseCase,
  ],
  exports: [
    EQUIPO_REPOSITORY,
    ObtenerEquipoUseCase,
    ObtenerMiEquipoUseCase,
    ModificarEquipoUseCase,
    PostularEquipoUseCase,
    ListarPostulacionesEquipoUseCase,
    ResponderPostulacionUseCase,
    CancelarPostulacionUseCase,
    ObtenerMisPostulacionesUseCase,
  ],
})
export class EquiposModule {}
