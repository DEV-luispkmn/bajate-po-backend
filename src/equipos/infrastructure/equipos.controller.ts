import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CrearEquipoUseCase } from '../application/crear-equipo.use-case';
import { ListarEquiposUseCase } from '../application/listar-equipos.use-case';
import { ObtenerEquipoUseCase } from '../application/obtener-equipo.use-case';
import { ObtenerMiEquipoUseCase } from '../application/obtener-mi-equipo.use-case';
import { UnirseEquipoUseCase } from '../application/unirse-equipo.use-case';
import { SalirEquipoUseCase } from '../application/salir-equipo.use-case';
import { DesintegrarEquipoUseCase } from '../application/desintegrar-equipo.use-case';
import { CambiarPostulacionesUseCase } from '../application/cambiar-postulaciones.use-case';
import { AsignarTLUseCase } from '../application/asignar-tl.use-case';
import { ModificarEquipoUseCase } from '../application/modificar-equipo.use-case';
import { PostularEquipoUseCase } from '../application/postular-equipo.use-case';
import { ListarPostulacionesEquipoUseCase } from '../application/listar-postulaciones-equipo.use-case';
import { ResponderPostulacionUseCase } from '../application/responder-postulacion.use-case';
import { CancelarPostulacionUseCase } from '../application/cancelar-postulacion.use-case';
import { ObtenerMisPostulacionesUseCase } from '../application/obtener-mis-postulaciones.use-case';
import { CrearEquipoDto } from '../application/crear-equipo.dto';
import { ModificarEquipoDto } from '../application/modificar-equipo.dto';
import { PostularEquipoDto } from '../application/postular-equipo.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '../../auth/infrastructure/current-user.decorator';
import { Equipo } from '../domain/equipo.entity';
import { PostulacionEquipo, EstadoPostulacion } from '../domain/postulacion.entity';

@Controller('equipos')
export class EquiposController {
  constructor(
    private readonly crearEquipoUseCase: CrearEquipoUseCase,
    private readonly listarEquiposUseCase: ListarEquiposUseCase,
    private readonly obtenerEquipoUseCase: ObtenerEquipoUseCase,
    private readonly obtenerMiEquipoUseCase: ObtenerMiEquipoUseCase,
    private readonly unirseEquipoUseCase: UnirseEquipoUseCase,
    private readonly salirEquipoUseCase: SalirEquipoUseCase,
    private readonly desintegrarEquipoUseCase: DesintegrarEquipoUseCase,
    private readonly cambiarPostulacionesUseCase: CambiarPostulacionesUseCase,
    private readonly asignarTLUseCase: AsignarTLUseCase,
    private readonly modificarEquipoUseCase: ModificarEquipoUseCase,
    private readonly postularEquipoUseCase: PostularEquipoUseCase,
    private readonly listarPostulacionesEquipoUseCase: ListarPostulacionesEquipoUseCase,
    private readonly responderPostulacionUseCase: ResponderPostulacionUseCase,
    private readonly cancelarPostulacionUseCase: CancelarPostulacionUseCase,
    private readonly obtenerMisPostulacionesUseCase: ObtenerMisPostulacionesUseCase,
  ) {}

  @Get()
  async listar(
    @Query('region') region?: string,
    @Query('search') search?: string,
  ): Promise<Equipo[]> {
    return this.listarEquiposUseCase.execute({ region, search });
  }

  @Get('mi-equipo')
  @UseGuards(JwtAuthGuard)
  async obtenerMiEquipo(@CurrentUser() user: any): Promise<Equipo | null> {
    return this.obtenerMiEquipoUseCase.execute(user.id ?? user.userId);
  }

  @Get('mis-postulaciones')
  @UseGuards(JwtAuthGuard)
  async misPostulaciones(@CurrentUser() user: any): Promise<PostulacionEquipo[]> {
    return this.obtenerMisPostulacionesUseCase.execute(user.id ?? user.userId);
  }

  @Get('mi-equipo/postulaciones')
  @UseGuards(JwtAuthGuard)
  async listarPostulaciones(
    @CurrentUser() user: any,
    @Query('estado') estado?: string,
  ): Promise<PostulacionEquipo[]> {
    return this.listarPostulacionesEquipoUseCase.execute(
      user.id ?? user.userId,
      estado as EstadoPostulacion,
    );
  }

  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number): Promise<Equipo> {
    return this.obtenerEquipoUseCase.execute(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @CurrentUser() user: any,
    @Body() dto: CrearEquipoDto,
  ): Promise<Equipo> {
    return this.crearEquipoUseCase.execute(dto, user.id ?? user.userId);
  }

  @Post(':id/unirse')
  @UseGuards(JwtAuthGuard)
  async unirsePorId(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Equipo> {
    return this.unirseEquipoUseCase.execute(user.id ?? user.userId, { equipoId: id });
  }

  @Post('unirse-codigo')
  @UseGuards(JwtAuthGuard)
  async unirsePorCodigo(
    @CurrentUser() user: any,
    @Body('codigoAcceso') codigoAcceso: string,
  ): Promise<Equipo> {
    return this.unirseEquipoUseCase.execute(user.id ?? user.userId, { codigoAcceso });
  }

  @Post('salir')
  @UseGuards(JwtAuthGuard)
  async salir(@CurrentUser() user: any): Promise<{ mensaje: string }> {
    return this.salirEquipoUseCase.execute(user.id ?? user.userId);
  }

  @Delete('mi-equipo')
  @UseGuards(JwtAuthGuard)
  async desintegrar(@CurrentUser() user: any): Promise<{ mensaje: string }> {
    return this.desintegrarEquipoUseCase.execute(user.id ?? user.userId);
  }

  @Post('mi-equipo/desintegrar')
  @UseGuards(JwtAuthGuard)
  async desintegrarPost(@CurrentUser() user: any): Promise<{ mensaje: string }> {
    return this.desintegrarEquipoUseCase.execute(user.id ?? user.userId);
  }

  @Patch('mi-equipo')
  @UseGuards(JwtAuthGuard)
  async modificar(
    @CurrentUser() user: any,
    @Body() dto: ModificarEquipoDto,
  ): Promise<Equipo> {
    return this.modificarEquipoUseCase.execute(user.id ?? user.userId, dto);
  }

  @Patch('mi-equipo/postulaciones')
  @UseGuards(JwtAuthGuard)
  async cambiarPostulaciones(
    @CurrentUser() user: any,
    @Body('abiertas') abiertas: boolean,
  ): Promise<Equipo> {
    return this.cambiarPostulacionesUseCase.execute(user.id ?? user.userId, Boolean(abiertas));
  }

  @Post('mi-equipo/asignar-tl')
  @UseGuards(JwtAuthGuard)
  async asignarTL(
    @CurrentUser() user: any,
    @Body('nuevoTlId', ParseIntPipe) nuevoTlId: number,
  ): Promise<Equipo> {
    return this.asignarTLUseCase.execute(user.id ?? user.userId, nuevoTlId);
  }

  @Post(':id/postular')
  @UseGuards(JwtAuthGuard)
  async postular(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PostularEquipoDto,
  ): Promise<PostulacionEquipo> {
    return this.postularEquipoUseCase.execute(user.id ?? user.userId, id, dto);
  }

  @Post('mi-equipo/postulaciones/:id/responder')
  @UseGuards(JwtAuthGuard)
  async responderPostulacion(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('decision') decision: 'ACEPTAR' | 'RECHAZAR',
    @Body('motivo') motivo?: string,
  ): Promise<PostulacionEquipo> {
    return this.responderPostulacionUseCase.execute(user.id ?? user.userId, id, decision, motivo);
  }

  @Delete('mis-postulaciones/:id')
  @UseGuards(JwtAuthGuard)
  async cancelarPostulacion(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PostulacionEquipo> {
    return this.cancelarPostulacionUseCase.execute(user.id ?? user.userId, id);
  }
}
