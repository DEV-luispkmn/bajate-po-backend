import { Module } from '@nestjs/common';
import { CanchasController } from './infrastructure/canchas.controller';
import { CrearCanchaUseCase } from './application/crear-cancha.use-case';
import { ListarCanchasUseCase } from './application/listar-canchas.use-case';
import { CANCHA_REPOSITORY } from './domain/cancha.repository.interface';
import { PrismaCanchaRepository } from './infrastructure/prisma-cancha.repository';

@Module({
  controllers: [CanchasController],
  providers: [
    CrearCanchaUseCase,
    ListarCanchasUseCase,
    {
      provide: CANCHA_REPOSITORY,
      useClass: PrismaCanchaRepository,
    },
  ],
  exports: [CANCHA_REPOSITORY],
})
export class CanchasModule {}
