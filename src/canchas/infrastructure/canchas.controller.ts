import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { CrearCanchaUseCase } from '../application/crear-cancha.use-case';
import { ModificarCanchaUseCase } from '../application/modificar-cancha.use-case';
import { ListarCanchasUseCase } from '../application/listar-canchas.use-case';
import { CrearCanchaDto } from '../application/crear-cancha.dto';
import { ModificarCanchaDto } from '../application/modificar-cancha.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '../../auth/infrastructure/current-user.decorator';

@Controller('canchas')
export class CanchasController {
  constructor(
    private readonly crearCanchaUseCase: CrearCanchaUseCase,
    private readonly modificarCanchaUseCase: ModificarCanchaUseCase,
    private readonly listarCanchasUseCase: ListarCanchasUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CrearCanchaDto, @CurrentUser() user: any) {
    const jugadorId = Number(user?.id ?? user?.userId ?? user?.sub);
    return this.crearCanchaUseCase.execute(dto, jugadorId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async modificar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModificarCanchaDto,
    @CurrentUser() user: any,
  ) {
    if (!user.esAdmin) {
      throw new ForbiddenException(
        'Solo los administradores de la Comandancia pueden editar canchas directamente. Si deseas proponer correcciones o fotos, utiliza la opción Sugerir Cambios.',
      );
    }
    return this.modificarCanchaUseCase.execute(id, dto);
  }

  @Get()
  async listar(
    @Query('region') region?: string,
    @Query('regiones') regionesStr?: string,
    @Query('usuarioId') usuarioIdStr?: string,
  ) {
    const regiones = regionesStr
      ? regionesStr.split(',').map((r) => r.trim()).filter(Boolean)
      : undefined;
    const usuarioId = usuarioIdStr ? Number(usuarioIdStr) : undefined;
    return this.listarCanchasUseCase.execute(region, regiones, usuarioId);
  }
}
