import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Put,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CrearEventoUseCase } from '../application/crear-evento.use-case';
import { ListarEventosUseCase } from '../application/listar-eventos.use-case';
import { ObtenerEventoUseCase } from '../application/obtener-evento.use-case';
import { UnirseEventoUseCase } from '../application/unirse-evento.use-case';
import { DesinscribirseEventoUseCase } from '../application/desinscribirse-evento.use-case';
import { CambiarEstadoEventoUseCase } from '../application/cambiar-estado-evento.use-case';
import { ModificarEventoUseCase } from '../application/modificar-evento.use-case';
import { EliminarEventoUseCase } from '../application/eliminar-evento.use-case';
import { GestionarInscripcionesUseCase } from '../application/gestionar-inscripciones.use-case';
import { DesignarLiderBandoUseCase } from '../application/designar-lider-bando.use-case';
import { GestionarEscuadrasUseCase } from '../application/gestionar-escuadras.use-case';
import { UnirseEscuadraUseCase } from '../application/unirse-escuadra.use-case';
import { GestionarCoorganizadoresUseCase } from '../application/gestionar-coorganizadores.use-case';
import { GestionarTacsopUseCase } from '../application/gestionar-tacsop.use-case';
import { GestionarFasesUseCase } from '../application/gestionar-fases.use-case';
import { GestionarCronoUseCase } from '../application/gestionar-crono.use-case';
import { GestionarMisionesUseCase } from '../application/gestionar-misiones.use-case';
import { CrearMisionDto, ActualizarEstadoMisionDto } from '../application/gestionar-misiones.dto';
import { GuardarTacsopDto, ActualizarCommsDto, ActualizarMapaTacticoDto } from '../application/gestionar-tacsop.dto';
import { CrearFaseDto, ActualizarFaseDto } from '../application/gestionar-fases.dto';
import { RegistrarCronoReplicaDto } from '../application/gestionar-crono.dto';
import { CrearEventoDto } from '../application/crear-evento.dto';
import { UnirseEventoDto } from '../application/unirse-evento.dto';
import { CambiarEstadoEventoDto } from '../application/cambiar-estado-evento.dto';
import { ModificarEventoDto } from '../application/modificar-evento.dto';
import { GestionarInscripcionesDto } from '../application/gestionar-inscripciones.dto';
import { DesignarLiderBandoDto } from '../application/designar-lider-bando.dto';
import { CrearEscuadraDto, GenerarEscuadrasDto } from '../application/gestionar-escuadras.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '../../auth/infrastructure/current-user.decorator';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import type { EstadoEvento, TipoEvento, Privacidad } from '../domain/evento.entity';

@Controller('eventos')
export class EventosController {
  constructor(
    private readonly crearEventoUseCase: CrearEventoUseCase,
    private readonly listarEventosUseCase: ListarEventosUseCase,
    private readonly obtenerEventoUseCase: ObtenerEventoUseCase,
    private readonly unirseEventoUseCase: UnirseEventoUseCase,
    private readonly desinscribirseEventoUseCase: DesinscribirseEventoUseCase,
    private readonly cambiarEstadoEventoUseCase: CambiarEstadoEventoUseCase,
    private readonly modificarEventoUseCase: ModificarEventoUseCase,
    private readonly eliminarEventoUseCase: EliminarEventoUseCase,
    private readonly gestionarInscripcionesUseCase: GestionarInscripcionesUseCase,
    private readonly designarLiderBandoUseCase: DesignarLiderBandoUseCase,
    private readonly gestionarEscuadrasUseCase: GestionarEscuadrasUseCase,
    private readonly unirseEscuadraUseCase: UnirseEscuadraUseCase,
    private readonly gestionarCoorganizadoresUseCase: GestionarCoorganizadoresUseCase,
    private readonly gestionarTacsopUseCase: GestionarTacsopUseCase,
    private readonly gestionarFasesUseCase: GestionarFasesUseCase,
    private readonly gestionarCronoUseCase: GestionarCronoUseCase,
    private readonly gestionarMisionesUseCase: GestionarMisionesUseCase,
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CrearEventoDto, @CurrentUser() user: any) {
    return this.crearEventoUseCase.execute(dto, user.id);
  }

  @Get('equipos')
  async listarEquipos() {
    return this.eventoRepository.listarEquipos();
  }

  @Get()
  async listar(
    @Query('estado') estado?: EstadoEvento,
    @Query('tipo') tipo?: TipoEvento,
    @Query('privacidad') privacidad?: Privacidad,
    @Query('region') region?: string,
    @Query('jugadorId') jugadorIdStr?: string,
  ) {
    const jugadorId = jugadorIdStr ? parseInt(jugadorIdStr, 10) : undefined;
    return this.listarEventosUseCase.execute({ estado, tipo, privacidad, region, jugadorId });
  }

  @Get('codigo/:codigo')
  async obtenerPorCodigo(@Param('codigo') codigo: string) {
    const codigoLimpio = codigo.trim().toUpperCase();
    const evento = await this.eventoRepository.findByCodigoInvitacion(codigoLimpio);
    if (!evento) {
      throw new NotFoundException(`No existe ninguna partida con el código "${codigoLimpio}"`);
    }
    return this.obtenerEventoUseCase.execute(evento.id);
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

  @Delete(':id/desinscribirse')
  @UseGuards(JwtAuthGuard)
  async desinscribirse(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const jugadorId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.desinscribirseEventoUseCase.execute(id, jugadorId);
  }

  @Post(':id/desinscribirse')
  @UseGuards(JwtAuthGuard)
  async desinscribirsePost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const jugadorId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.desinscribirseEventoUseCase.execute(id, jugadorId);
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async modificar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModificarEventoDto,
    @CurrentUser() user: any,
  ) {
    return this.modificarEventoUseCase.execute(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.eliminarEventoUseCase.execute(id, user.id);
  }

  // --- Endpoints para Eventos Masivos: Inscripciones, Facciones, Escuadras y Co-organizadores ---

  @Patch(':id/inscripciones')
  @UseGuards(JwtAuthGuard)
  async gestionarInscripciones(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GestionarInscripcionesDto,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarInscripcionesUseCase.execute(id, dto.abiertas, solicitanteId);
  }

  @Patch(':id/bandos/:bandoId/lider')
  @UseGuards(JwtAuthGuard)
  async designarLiderBando(
    @Param('id', ParseIntPipe) id: number,
    @Param('bandoId', ParseIntPipe) bandoId: number,
    @Body() dto: DesignarLiderBandoDto,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.designarLiderBandoUseCase.execute(id, bandoId, dto.jugadorId ?? null, solicitanteId);
  }

  @Post(':id/bandos/:bandoId/escuadras')
  @UseGuards(JwtAuthGuard)
  async crearEscuadra(
    @Param('id', ParseIntPipe) id: number,
    @Param('bandoId', ParseIntPipe) bandoId: number,
    @Body() dto: CrearEscuadraDto,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarEscuadrasUseCase.crearEscuadra(id, bandoId, dto, solicitanteId);
  }

  @Post(':id/bandos/:bandoId/escuadras/generar')
  @UseGuards(JwtAuthGuard)
  async generarEscuadras(
    @Param('id', ParseIntPipe) id: number,
    @Param('bandoId', ParseIntPipe) bandoId: number,
    @Body() dto: GenerarEscuadrasDto,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarEscuadrasUseCase.generarEscuadras(id, bandoId, dto, solicitanteId);
  }

  @Delete(':id/escuadras/:escuadraId')
  @UseGuards(JwtAuthGuard)
  async eliminarEscuadra(
    @Param('id', ParseIntPipe) id: number,
    @Param('escuadraId', ParseIntPipe) escuadraId: number,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarEscuadrasUseCase.eliminarEscuadra(id, escuadraId, solicitanteId);
  }

  @Post(':id/escuadras/:escuadraId/unirse')
  @UseGuards(JwtAuthGuard)
  async unirseEscuadra(
    @Param('id', ParseIntPipe) id: number,
    @Param('escuadraId', ParseIntPipe) escuadraId: number,
    @CurrentUser() user: any,
  ) {
    const jugadorId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.unirseEscuadraUseCase.unirse(id, escuadraId, jugadorId);
  }

  @Delete(':id/escuadras/salir')
  @UseGuards(JwtAuthGuard)
  async salirEscuadra(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const jugadorId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.unirseEscuadraUseCase.salir(id, jugadorId);
  }

  @Post(':id/organizadores')
  @UseGuards(JwtAuthGuard)
  async agregarCoorganizador(
    @Param('id', ParseIntPipe) id: number,
    @Body('jugadorId', ParseIntPipe) nuevoOrganizadorId: number,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarCoorganizadoresUseCase.agregar(id, nuevoOrganizadorId, solicitanteId);
  }

  @Delete(':id/organizadores/:jugadorId')
  @UseGuards(JwtAuthGuard)
  async removerCoorganizador(
    @Param('id', ParseIntPipe) id: number,
    @Param('jugadorId', ParseIntPipe) coorganizadorId: number,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarCoorganizadoresUseCase.remover(id, coorganizadorId, solicitanteId);
  }

  // --- Endpoints TACSOP, COMMS, Fases y Crono ---

  @Put(':id/tacsop')
  @UseGuards(JwtAuthGuard)
  async guardarTacsop(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GuardarTacsopDto,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarTacsopUseCase.guardarTacsop(id, dto, solicitanteId);
  }

  @Patch(':id/bandos/:bandoId/comms')
  @UseGuards(JwtAuthGuard)
  async actualizarCommsBando(
    @Param('id', ParseIntPipe) id: number,
    @Param('bandoId', ParseIntPipe) bandoId: number,
    @Body() dto: ActualizarCommsDto,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarTacsopUseCase.actualizarCommsBando(id, bandoId, dto, solicitanteId);
  }

  @Patch(':id/escuadras/:escuadraId/comms')
  @UseGuards(JwtAuthGuard)
  async actualizarCommsEscuadra(
    @Param('id', ParseIntPipe) id: number,
    @Param('escuadraId', ParseIntPipe) escuadraId: number,
    @Body() dto: ActualizarCommsDto,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarTacsopUseCase.actualizarCommsEscuadra(id, escuadraId, dto, solicitanteId);
  }

  @Patch(':id/mapa-tactico')
  @UseGuards(JwtAuthGuard)
  async actualizarMapaTactico(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarMapaTacticoDto,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarTacsopUseCase.actualizarMapaTactico(id, dto, solicitanteId);
  }

  @Post(':id/fases')
  @UseGuards(JwtAuthGuard)
  async crearFase(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearFaseDto,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarFasesUseCase.crearFase(id, dto, solicitanteId);
  }

  @Patch(':id/fases/:faseId')
  @UseGuards(JwtAuthGuard)
  async actualizarFase(
    @Param('id', ParseIntPipe) id: number,
    @Param('faseId', ParseIntPipe) faseId: number,
    @Body() dto: ActualizarFaseDto,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarFasesUseCase.actualizarFase(id, faseId, dto, solicitanteId);
  }

  @Delete(':id/fases/:faseId')
  @UseGuards(JwtAuthGuard)
  async eliminarFase(
    @Param('id', ParseIntPipe) id: number,
    @Param('faseId', ParseIntPipe) faseId: number,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarFasesUseCase.eliminarFase(id, faseId, solicitanteId);
  }

  @Post(':id/fases/:faseId/activar')
  @UseGuards(JwtAuthGuard)
  async activarFase(
    @Param('id', ParseIntPipe) id: number,
    @Param('faseId', ParseIntPipe) faseId: number,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarFasesUseCase.activarFase(id, faseId, solicitanteId);
  }

  @Post(':id/crono')
  @UseGuards(JwtAuthGuard)
  async registrarCrono(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarCronoReplicaDto,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarCronoUseCase.registrarReplica(id, dto, solicitanteId);
  }

  @Delete(':id/crono/:cronoId')
  @UseGuards(JwtAuthGuard)
  async eliminarCrono(
    @Param('id', ParseIntPipe) id: number,
    @Param('cronoId', ParseIntPipe) cronoId: number,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarCronoUseCase.eliminarRegistro(id, cronoId, solicitanteId);
  }

  @Post(':id/misiones')
  @UseGuards(JwtAuthGuard)
  async crearMision(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearMisionDto,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarMisionesUseCase.crearMision(id, dto, solicitanteId);
  }

  @Patch(':id/misiones/:misionId/estado')
  @UseGuards(JwtAuthGuard)
  async actualizarEstadoMision(
    @Param('id', ParseIntPipe) id: number,
    @Param('misionId', ParseIntPipe) misionId: number,
    @Body() dto: ActualizarEstadoMisionDto,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarMisionesUseCase.actualizarEstadoMision(id, misionId, dto, solicitanteId);
  }

  @Delete(':id/misiones/:misionId')
  @UseGuards(JwtAuthGuard)
  async eliminarMision(
    @Param('id', ParseIntPipe) id: number,
    @Param('misionId', ParseIntPipe) misionId: number,
    @CurrentUser() user: any,
  ) {
    const solicitanteId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.gestionarMisionesUseCase.eliminarMision(id, misionId, solicitanteId);
  }
}
