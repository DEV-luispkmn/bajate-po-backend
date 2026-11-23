import { Module } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PrismaModule } from './prisma/prisma.module';
import { JugadoresModule } from './jugadores/jugadores.module';
import { AuthModule } from './auth/auth.module';
import { CanchasModule } from './canchas/canchas.module';
import { EventosModule } from './eventos/eventos.module';
import { PartidasModule } from './partidas/partidas.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { EquiposModule } from './equipos/equipos.module';
import { AdminModule } from './admin/admin.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';

const adminDistPath = join(process.cwd(), '..', 'bajate-po-admin', 'dist');
const hasAdminDist = fs.existsSync(adminDistPath);

@Module({
  imports: [
    PrismaModule,
    JugadoresModule,
    AuthModule,
    CanchasModule,
    EventosModule,
    PartidasModule,
    ConfiguracionModule,
    EquiposModule,
    AdminModule,
    NotificacionesModule,
    ...(hasAdminDist
      ? [
          ServeStaticModule.forRoot({
            rootPath: adminDistPath,
            serveRoot: '/admin',
          }),
        ]
      : []),
  ],
})
export class AppModule {}
