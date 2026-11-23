import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notificaciones',
})
export class NotificacionesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificacionesGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado al canal de Notificaciones: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado del canal de Notificaciones: ${client.id}`);
  }

  @SubscribeMessage('autenticar')
  handleAutenticar(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jugadorId: number },
  ) {
    if (data?.jugadorId) {
      const sala = `jugador_${data.jugadorId}`;
      client.join(sala);
      this.logger.log(`Cliente ${client.id} suscrito a la sala táctica: ${sala}`);
      return { status: 'autenticado', sala };
    }
    return { status: 'error', mensaje: 'jugadorId requerido' };
  }

  notificarNuevaNotificacion(jugadorId: number, notificacion: any): void {
    const sala = `jugador_${jugadorId}`;
    this.logger.log(
      `Emitiendo nueva_notificacion a sala ${sala}: "${notificacion.titulo}"`,
    );
    if (this.server) {
      this.server.to(sala).emit('nueva_notificacion', notificacion);
    }
  }
}
