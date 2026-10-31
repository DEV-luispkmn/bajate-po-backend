import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CrearPartidaUseCase } from '../application/crear-partida.use-case';
import { RegistrarRondaUseCase } from '../application/registrar-ronda.use-case';
import { SincronizarRondasUseCase } from '../application/sincronizar-rondas.use-case';
import { ListarPartidasEventoUseCase } from '../application/listar-partidas-evento.use-case';
import { CrearPartidaDto } from '../application/crear-partida.dto';
import { RegistrarRondaDto } from '../application/registrar-ronda.dto';
import { SincronizarRondasDto } from '../application/sincronizar-rondas.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';

@Controller('partidas')
export class PartidasController {
  constructor(
    private readonly crearPartidaUseCase: CrearPartidaUseCase,
    private readonly registrarRondaUseCase: RegistrarRondaUseCase,
    private readonly sincronizarRondasUseCase: SincronizarRondasUseCase,
    private readonly listarPartidasEventoUseCase: ListarPartidasEventoUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CrearPartidaDto) {
    return this.crearPartidaUseCase.execute(dto);
  }

  @Get('evento/:eventoId')
  async listarPorEvento(@Param('eventoId', ParseIntPipe) eventoId: number) {
    return this.listarPartidasEventoUseCase.execute(eventoId);
  }

  @Post(':id/rondas')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async registrarRonda(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarRondaDto,
  ) {
    return this.registrarRondaUseCase.execute(id, dto);
  }

  @Post(':id/rondas/sincronizar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sincronizarRondas(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SincronizarRondasDto,
  ) {
    return this.sincronizarRondasUseCase.execute(id, dto);
  }
}
