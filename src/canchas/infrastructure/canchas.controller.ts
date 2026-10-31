import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CrearCanchaUseCase } from '../application/crear-cancha.use-case';
import { ListarCanchasUseCase } from '../application/listar-canchas.use-case';
import { CrearCanchaDto } from '../application/crear-cancha.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';

@Controller('canchas')
export class CanchasController {
  constructor(
    private readonly crearCanchaUseCase: CrearCanchaUseCase,
    private readonly listarCanchasUseCase: ListarCanchasUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CrearCanchaDto) {
    return this.crearCanchaUseCase.execute(dto);
  }

  @Get()
  async listar() {
    return this.listarCanchasUseCase.execute();
  }
}
