import { Module } from '@nestjs/common';
import { EventosController } from './infrastructure/eventos.controller';
import { CrearEventoUseCase } from './application/crear-evento.use-case';
import { ListarEventosUseCase } from './application/listar-eventos.use-case';
import { ObtenerEventoUseCase } from './application/obtener-evento.use-case';
import { UnirseEventoUseCase } from './application/unirse-evento.use-case';
import { CambiarEstadoEventoUseCase } from './application/cambiar-estado-evento.use-case';
import { EVENTO_REPOSITORY } from './domain/evento.repository.interface';
import { PrismaEventoRepository } from './infrastructure/prisma-evento.repository';
import { CanchasModule } from '../canchas/canchas.module';

@Module({
  imports: [CanchasModule],
  controllers: [EventosController],
  providers: [
    CrearEventoUseCase,
    ListarEventosUseCase,
    ObtenerEventoUseCase,
    UnirseEventoUseCase,
    CambiarEstadoEventoUseCase,
    {
      provide: EVENTO_REPOSITORY,
      useClass: PrismaEventoRepository,
    },
  ],
  exports: [EVENTO_REPOSITORY],
})
export class EventosModule {}
