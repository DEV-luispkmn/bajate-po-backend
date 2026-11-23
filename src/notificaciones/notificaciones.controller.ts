import { Controller, Get, Patch, Param, ParseIntPipe, Body, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '../auth/infrastructure/current-user.decorator';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  async listar(@CurrentUser() user: any) {
    return this.notificacionesService.listarPorJugador(user.id ?? user.userId);
  }

  @Patch('push-token')
  async registrarPushToken(
    @CurrentUser() user: any,
    @Body('pushToken') pushToken?: string,
  ) {
    await this.notificacionesService.guardarPushToken(user.id ?? user.userId, pushToken);
    return { ok: true };
  }

  @Patch('marcar-todas')
  async marcarTodasLeidas(@CurrentUser() user: any) {
    await this.notificacionesService.marcarTodasLeidas(user.id ?? user.userId);
    return { ok: true };
  }

  @Patch(':id/leer')
  async marcarLeida(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    await this.notificacionesService.marcarLeida(id, user.id ?? user.userId);
    return { ok: true };
  }
}
