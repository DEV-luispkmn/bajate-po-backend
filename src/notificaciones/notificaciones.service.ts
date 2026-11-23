import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoNotificacion } from '@prisma/client';
import { NotificacionesGateway } from './notificaciones.gateway';

@Injectable()
export class NotificacionesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly gateway?: NotificacionesGateway,
  ) {}

  async crear(datos: {
    jugadorId: number;
    titulo: string;
    mensaje: string;
    tipo?: TipoNotificacion;
    link?: string;
  }) {
    const jugador = await this.prisma.jugador.findUnique({
      where: { id: datos.jugadorId },
      select: { recibeNotificaciones: true, pushToken: true },
    });

    if (jugador && !jugador.recibeNotificaciones) {
      return null;
    }

    const notificacion = await this.prisma.notificacion.create({
      data: {
        jugadorId: datos.jugadorId,
        titulo: datos.titulo,
        mensaje: datos.mensaje,
        tipo: datos.tipo ?? 'SISTEMA',
        link: datos.link,
      },
    });

    // 1. Emisión en tiempo real vía WebSocket (para entrega instantánea en la app)
    if (this.gateway) {
      try {
        this.gateway.notificarNuevaNotificacion(datos.jugadorId, notificacion);
      } catch (err) {
        console.error('Error al emitir notificación por WebSocket:', err);
      }
    }

    // 2. Notificación push al teléfono vía Expo Push API
    if (jugador?.pushToken) {
      this.enviarPushExpo(jugador.pushToken, datos.titulo, datos.mensaje, notificacion).catch(
        (err) => console.error('Error enviando push expo:', err),
      );
    }

    return notificacion;
  }

  private async enviarPushExpo(
    pushToken: string,
    titulo: string,
    cuerpo: string,
    data: any,
  ) {
    if (!pushToken || (!pushToken.startsWith('ExponentPushToken') && !pushToken.startsWith('ExpoPushToken'))) {
      return;
    }

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: pushToken,
          sound: 'default',
          title: titulo,
          body: cuerpo,
          data: data,
          priority: 'high',
          channelId: 'tactical_alerts',
        }),
      });
    } catch (error) {
      console.warn('No se pudo enviar push a Expo:', error);
    }
  }

  async guardarPushToken(jugadorId: number, pushToken?: string | null) {
    return this.prisma.jugador.update({
      where: { id: jugadorId },
      data: { pushToken: pushToken || null },
    });
  }

  async listarPorJugador(jugadorId: number) {
    const [notificaciones, noLeidas] = await Promise.all([
      this.prisma.notificacion.findMany({
        where: { jugadorId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notificacion.count({
        where: { jugadorId, leida: false },
      }),
    ]);

    return { notificaciones, noLeidas };
  }

  async marcarLeida(id: number, jugadorId: number) {
    return this.prisma.notificacion.updateMany({
      where: { id, jugadorId },
      data: { leida: true },
    });
  }

  async marcarTodasLeidas(jugadorId: number) {
    return this.prisma.notificacion.updateMany({
      where: { jugadorId, leida: false },
      data: { leida: true },
    });
  }
}
