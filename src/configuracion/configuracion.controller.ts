import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { CrearTicketDto, ActualizarNotificacionesDto } from './dto/crear-ticket.dto';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '../auth/infrastructure/current-user.decorator';

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  @Get('modalidades')
  async listarModalidades() {
    return this.configuracionService.listarModalidades();
  }

  @Get('roles')
  async listarRoles() {
    return this.configuracionService.listarRoles();
  }

  @Get('rangos')
  async listarRangos() {
    return this.configuracionService.listarRangos();
  }

  @Get('logros')
  async listarLogros() {
    return this.configuracionService.listarLogros();
  }

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async crearTicket(@Body() dto: CrearTicketDto, @CurrentUser() user: any) {
    return this.configuracionService.crearTicket(dto, user.id);
  }

  @Get('mis-tickets')
  @UseGuards(JwtAuthGuard)
  async listarMisTickets(@CurrentUser() user: any) {
    return this.configuracionService.listarMisTickets(user.id);
  }

  @Patch('notificaciones')
  @UseGuards(JwtAuthGuard)
  async actualizarNotificaciones(
    @Body() dto: ActualizarNotificacionesDto,
    @CurrentUser() user: any,
  ) {
    return this.configuracionService.actualizarNotificaciones(dto.recibeNotificaciones, user.id);
  }
}
