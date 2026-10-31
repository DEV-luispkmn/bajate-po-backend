import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CrearEventoUseCase } from '../application/crear-evento.use-case';
import { ListarEventosUseCase } from '../application/listar-eventos.use-case';
import { ObtenerEventoUseCase } from '../application/obtener-evento.use-case';
import { UnirseEventoUseCase } from '../application/unirse-evento.use-case';
import { CambiarEstadoEventoUseCase } from '../application/cambiar-estado-evento.use-case';
import { CrearEventoDto } from '../application/crear-evento.dto';
import { UnirseEventoDto } from '../application/unirse-evento.dto';
import { CambiarEstadoEventoDto } from '../application/cambiar-estado-evento.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '../../auth/infrastructure/current-user.decorator';
import type { EstadoEvento, TipoEvento, Privacidad } from '../domain/evento.entity';

@Controller('eventos')
export class EventosController {
  constructor(
    private readonly crearEventoUseCase: CrearEventoUseCase,
    private readonly listarEventosUseCase: ListarEventosUseCase,
    private readonly obtenerEventoUseCase: ObtenerEventoUseCase,
    private readonly unirseEventoUseCase: UnirseEventoUseCase,
    private readonly cambiarEstadoEventoUseCase: CambiarEstadoEventoUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CrearEventoDto, @CurrentUser() user: any) {
    return this.crearEventoUseCase.execute(dto, user.id);
  }

  @Get()
  async listar(
    @Query('estado') estado?: EstadoEvento,
    @Query('tipo') tipo?: TipoEvento,
    @Query('privacidad') privacidad?: Privacidad,
  ) {
    return this.listarEventosUseCase.execute({ estado, tipo, privacidad });
  }

  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.obtenerEventoUseCase.execute(id);
  }

  @Post('unirse')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unirse(@Body() dto: UnirseEventoDto, @CurrentUser() user: any) {
    return this.unirseEventoUseCase.execute(dto, user.id);
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard)
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoEventoDto,
    @CurrentUser() user: any,
  ) {
    return this.cambiarEstadoEventoUseCase.execute(id, dto, user.id);
  }
}
