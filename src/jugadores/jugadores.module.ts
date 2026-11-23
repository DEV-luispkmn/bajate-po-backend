import { Module } from '@nestjs/common';
import { JugadoresController } from './infrastructure/jugadores.controller';
import { RegistrarJugadorUseCase } from './application/registrar-jugador.use-case';
import { ObtenerPerfilUseCase } from './application/obtener-perfil.use-case';
import { JUGADOR_REPOSITORY } from './domain/jugador.repository.interface';
import { PrismaJugadorRepository } from './infrastructure/prisma-jugador.repository';

@Module({
  controllers: [JugadoresController],
  providers: [
    RegistrarJugadorUseCase,
    ObtenerPerfilUseCase,
    {
      provide: JUGADOR_REPOSITORY,
      useClass: PrismaJugadorRepository,
    },
  ],
  exports: [JUGADOR_REPOSITORY],
})
export class JugadoresModule {}
