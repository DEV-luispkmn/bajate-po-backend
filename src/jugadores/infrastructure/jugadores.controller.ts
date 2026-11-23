import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RegistrarJugadorUseCase } from '../application/registrar-jugador.use-case';
import { ObtenerPerfilUseCase } from '../application/obtener-perfil.use-case';
import { RegistrarJugadorDto } from '../application/registrar-jugador.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '../../auth/infrastructure/current-user.decorator';
import { JUGADOR_REPOSITORY } from '../domain/jugador.repository.interface';
import { Inject } from '@nestjs/common';
import type { IJugadorRepository } from '../domain/jugador.repository.interface';

@Controller('jugadores')
export class JugadoresController {
  constructor(
    private readonly registrarJugadorUseCase: RegistrarJugadorUseCase,
    private readonly obtenerPerfilUseCase: ObtenerPerfilUseCase,
    @Inject(JUGADOR_REPOSITORY)
    private readonly jugadorRepository: IJugadorRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registrar(@Body() dto: RegistrarJugadorDto) {
    const jugador = await this.registrarJugadorUseCase.execute(dto);
    const { passwordHash: _passwordHash, ...jugadorPublico } = jugador;
    return jugadorPublico;
  }

  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  async obtenerMiPerfil(@CurrentUser() user: any) {
    return this.obtenerPerfilUseCase.execute(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('perfil')
  async actualizarMiPerfil(
    @CurrentUser() user: any,
    @Body()
    body: {
      alias?: string;
      rango?: string;
      avatarUrl?: string;
      region?: string;
      ciudad?: string;
      roles?: string;
      equipoId?: number;
    },
  ) {
    const updated = await this.jugadorRepository.actualizarPerfil(user.id, body);
    const { passwordHash: _passwordHash, ...publico } = updated;
    return publico;
  }
}
