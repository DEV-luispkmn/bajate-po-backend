import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { JugadoresModule } from './jugadores/jugadores.module';

@Module({
  imports: [AuthModule, JugadoresModule]
})
export class AppModule {}
