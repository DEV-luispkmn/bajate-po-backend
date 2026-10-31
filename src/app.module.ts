import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { JugadoresModule } from './jugadores/jugadores.module';
import { AuthModule } from './auth/auth.module';
import { CanchasModule } from './canchas/canchas.module';
import { EventosModule } from './eventos/eventos.module';
import { PartidasModule } from './partidas/partidas.module';

@Module({
  imports: [
    PrismaModule,
    JugadoresModule,
    AuthModule,
    CanchasModule,
    EventosModule,
    PartidasModule,
  ],
})
export class AppModule {}
