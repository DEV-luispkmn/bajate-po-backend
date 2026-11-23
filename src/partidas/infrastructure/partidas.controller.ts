import {
  Controller,
  Post,
  Patch,
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
import { ObtenerPartidaUseCase } from '../application/obtener-partida.use-case';
import { CambiarEstadoPartidaUseCase } from '../application/cambiar-estado-partida.use-case';
import { VotarMvpUseCase } from '../application/votar-mvp.use-case';
import { UnirsePartidaUseCase } from '../application/unirse-partida.use-case';
import { EvaluarFamaUseCase } from '../application/evaluar-fama.use-case';
import { CrearPartidaDto } from '../application/crear-partida.dto';
import { RegistrarRondaDto } from '../application/registrar-ronda.dto';
import { SincronizarRondasDto } from '../application/sincronizar-rondas.dto';
import { CambiarEstadoPartidaDto } from '../application/cambiar-estado-partida.dto';
import { VotarMvpDto } from '../application/votar-mvp.dto';
import { UnirsePartidaDto } from '../application/unirse-partida.dto';
import { EvaluarFamaDto } from '../application/evaluar-fama.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '../../auth/infrastructure/current-user.decorator';

@Controller('partidas')
export class PartidasController {
  constructor(
    private readonly crearPartidaUseCase: CrearPartidaUseCase,
    private readonly registrarRondaUseCase: RegistrarRondaUseCase,
    private readonly sincronizarRondasUseCase: SincronizarRondasUseCase,
    private readonly listarPartidasEventoUseCase: ListarPartidasEventoUseCase,
    private readonly obtenerPartidaUseCase: ObtenerPartidaUseCase,
    private readonly cambiarEstadoPartidaUseCase: CambiarEstadoPartidaUseCase,
    private readonly votarMvpUseCase: VotarMvpUseCase,
    private readonly unirsePartidaUseCase: UnirsePartidaUseCase,
    private readonly evaluarFamaUseCase: EvaluarFamaUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CrearPartidaDto, @CurrentUser() user: any) {
    return this.crearPartidaUseCase.execute(dto, user?.id);
  }

  @Get('evento/:eventoId')
  async listarPorEvento(@Param('eventoId', ParseIntPipe) eventoId: number) {
    return this.listarPartidasEventoUseCase.execute(eventoId);
  }

  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.obtenerPartidaUseCase.execute(id);
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard)
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoPartidaDto,
    @CurrentUser() user: any,
  ) {
    return this.cambiarEstadoPartidaUseCase.execute(id, dto, user?.id);
  }

  @Post(':id/rondas')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async registrarRonda(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarRondaDto,
    @CurrentUser() user: any,
  ) {
    return this.registrarRondaUseCase.execute(id, dto, user?.id);
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

  @Post(':id/votar-mvp')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async votarMvp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VotarMvpDto,
    @CurrentUser() user: any,
  ) {
    return this.votarMvpUseCase.execute(id, dto.candidatoId, user?.id);
  }

  @Post(':id/unirse')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unirsePartida(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UnirsePartidaDto,
    @CurrentUser() user: any,
  ) {
    return this.unirsePartidaUseCase.execute(id, user?.id, dto);
  }

  @Post(':id/evaluar-fama')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async evaluarFama(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EvaluarFamaDto,
    @CurrentUser() user: any,
  ) {
    return this.evaluarFamaUseCase.execute(id, user?.id, dto);
  }

  @Get(':id/mis-evaluaciones-fama')
  @UseGuards(JwtAuthGuard)
  async misEvaluacionesFama(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.evaluarFamaUseCase.obtenerMisEvaluaciones(id, user?.id);
  }
}

