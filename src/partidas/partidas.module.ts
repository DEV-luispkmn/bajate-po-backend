import { Module } from '@nestjs/common';
import { PartidasController } from './infrastructure/partidas.controller';
import { CrearPartidaUseCase } from './application/crear-partida.use-case';
import { RegistrarRondaUseCase } from './application/registrar-ronda.use-case';
import { SincronizarRondasUseCase } from './application/sincronizar-rondas.use-case';
import { ListarPartidasEventoUseCase } from './application/listar-partidas-evento.use-case';
import { PARTIDA_REPOSITORY } from './domain/partida.repository.interface';
import { PrismaPartidaRepository } from './infrastructure/prisma-partida.repository';
import { PartidasGateway } from './infrastructure/partidas.gateway';
import { PARTIDA_NOTIFICATION_SERVICE } from './application/partida-notification.interface';
import { EventosModule } from '../eventos/eventos.module';

@Module({
  imports: [EventosModule],
  controllers: [PartidasController],
  providers: [
    CrearPartidaUseCase,
    RegistrarRondaUseCase,
    SincronizarRondasUseCase,
    ListarPartidasEventoUseCase,
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
