import { Module } from '@nestjs/common';
import { PartidasController } from './infrastructure/partidas.controller';
import { CrearPartidaUseCase } from './application/crear-partida.use-case';
import { RegistrarRondaUseCase } from './application/registrar-ronda.use-case';
import { SincronizarRondasUseCase } from './application/sincronizar-rondas.use-case';
import { ListarPartidasEventoUseCase } from './application/listar-partidas-evento.use-case';
import { ObtenerPartidaUseCase } from './application/obtener-partida.use-case';
import { CambiarEstadoPartidaUseCase } from './application/cambiar-estado-partida.use-case';
import { VotarMvpUseCase } from './application/votar-mvp.use-case';
import { UnirsePartidaUseCase } from './application/unirse-partida.use-case';
import { EvaluarFamaUseCase } from './application/evaluar-fama.use-case';
import { PARTIDA_REPOSITORY } from './domain/partida.repository.interface';
import { PrismaPartidaRepository } from './infrastructure/prisma-partida.repository';
import { PartidasGateway } from './infrastructure/partidas.gateway';
import { PARTIDA_NOTIFICATION_SERVICE } from './application/partida-notification.interface';
import { EventosModule } from '../eventos/eventos.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [EventosModule, NotificacionesModule],
  controllers: [PartidasController],
  providers: [
    CrearPartidaUseCase,
    RegistrarRondaUseCase,
    SincronizarRondasUseCase,
    ListarPartidasEventoUseCase,
    ObtenerPartidaUseCase,
    CambiarEstadoPartidaUseCase,
    VotarMvpUseCase,
    UnirsePartidaUseCase,
    EvaluarFamaUseCase,
    PartidasGateway,
    {
      provide: PARTIDA_NOTIFICATION_SERVICE,
      useExisting: PartidasGateway,
    },
    {
      provide: PARTIDA_REPOSITORY,
      useClass: PrismaPartidaRepository,
    },
  ],
  exports: [PARTIDA_REPOSITORY, PARTIDA_NOTIFICATION_SERVICE],
})
export class PartidasModule {}
