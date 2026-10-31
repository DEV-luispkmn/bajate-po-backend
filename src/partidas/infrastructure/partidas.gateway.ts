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
import { IPartidaNotificationService } from '../application/partida-notification.interface';
import { Ronda, EstadoPartida } from '../domain/partida.entity';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'partidas',
})
export class PartidasGateway
  implements OnGatewayConnection, OnGatewayDisconnect, IPartidaNotificationService
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PartidasGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado a WebSockets: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado de WebSockets: ${client.id}`);
  }

  @SubscribeMessage('unirse_partida')
  handleUnirsePartida(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { partidaId: number },
  ) {
    const sala = `partida_${data.partidaId}`;
    client.join(sala);
    this.logger.log(`Cliente ${client.id} se unió a la sala en vivo: ${sala}`);
    return { status: 'conectado', sala, partidaId: data.partidaId };
  }

  @SubscribeMessage('salir_partida')
  handleSalirPartida(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { partidaId: number },
  ) {
    const sala = `partida_${data.partidaId}`;
    client.leave(sala);
    this.logger.log(`Cliente ${client.id} salió de la sala: ${sala}`);
    return { status: 'desconectado', sala };
  }

  // Métodos del puerto IPartidaNotificationService (Emisiones en tiempo real)

  notificarRondaRegistrada(
    partidaId: number,
    ronda: Ronda,
    marcador: Record<number, number>,
  ): void {
    const sala = `partida_${partidaId}`;
    this.logger.log(
      `Emitiendo ronda_registrada a ${sala}: Ronda ${ronda.numeroRonda}, Ganador: ${ronda.bandoGanadorNombre ?? 'Empate'}`,
    );

    this.server.to(sala).emit('ronda_registrada', {
      partidaId,
      ronda,
      marcador,
    });
  }

  notificarRondasSincronizadas(
    partidaId: number,
    rondas: Ronda[],
    marcador: Record<number, number>,
  ): void {
    const sala = `partida_${partidaId}`;
    this.logger.log(
      `Emitiendo rondas_sincronizadas a ${sala}: ${rondas.length} rondas sincronizadas masivamente`,
    );

    this.server.to(sala).emit('rondas_sincronizadas', {
      partidaId,
      rondas,
      marcador,
    });
  }

  notificarEstadoCambiado(
    partidaId: number,
    nuevoEstado: EstadoPartida,
  ): void {
    const sala = `partida_${partidaId}`;
    this.logger.log(`Emitiendo partida_estado_cambiado a ${sala}: Nuevo estado -> ${nuevoEstado}`);

    this.server.to(sala).emit('partida_estado_cambiado', {
      partidaId,
      nuevoEstado,
    });
  }
}
