import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/infrastructure/admin.guard';
import { CurrentUser } from '../auth/infrastructure/current-user.decorator';
import { CambiarEstadoCanchaDto } from './dto/cambiar-estado-cancha.dto';
import { ResponderTicketDto } from './dto/responder-ticket.dto';
import { ToggleAdminDto } from './dto/toggle-admin.dto';
import { ToggleActivoEquipoDto } from './dto/toggle-activo-equipo.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('estadisticas')
  async obtenerEstadisticas() {
    return this.adminService.obtenerEstadisticas();
  }

  @Get('canchas')
  async listarCanchas(
    @Query('estado') estado?: string,
    @Query('region') region?: string,
  ) {
    return this.adminService.listarCanchas(estado, region);
  }

  @Patch('canchas/:id/estado')
  async cambiarEstadoCancha(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoCanchaDto,
  ) {
    return this.adminService.cambiarEstadoCancha(id, dto);
  }

  @Patch('canchas/:id')
  async modificarCancha(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.adminService.modificarCancha(id, dto);
  }

  @Get('tickets')
  async listarTickets(
    @Query('tipo') tipo?: string,
    @Query('estado') estado?: string,
  ) {
    return this.adminService.listarTickets(tipo, estado);
  }

  @Patch('tickets/:id/responder')
  async responderTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResponderTicketDto,
  ) {
    return this.adminService.responderTicket(id, dto);
  }

  @Get('jugadores')
  async listarJugadores(
    @Query('busqueda') busqueda?: string,
    @Query('region') region?: string,
  ) {
    return this.adminService.listarJugadores(busqueda, region);
  }

  @Patch('jugadores/:id/admin')
  async toggleAdminJugador(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleAdminDto,
  ) {
    return this.adminService.toggleAdminJugador(id, dto.esAdmin);
  }

  @Delete('jugadores/:id')
  async eliminarJugador(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() adminUser: any,
  ) {
    const adminId = Number(adminUser?.id ?? adminUser?.userId ?? adminUser?.sub);
    if (adminId && adminId === id) {
      throw new BadRequestException('Acción denegada: No puedes eliminar tu propia cuenta de Administrador en uso.');
    }
    return this.adminService.eliminarJugador(id);
  }

  @Get('equipos')
  async listarEquipos(
    @Query('region') region?: string,
    @Query('activo') activoStr?: string,
  ) {
    const activo =
      activoStr === 'true' ? true : activoStr === 'false' ? false : undefined;
    return this.adminService.listarEquipos(region, activo);
  }

  @Patch('equipos/:id/activo')
  async toggleActivoEquipo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleActivoEquipoDto,
  ) {
    return this.adminService.toggleActivoEquipo(id, dto.activo);
  }
}
