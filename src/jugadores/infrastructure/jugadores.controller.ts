import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RegistrarJugadorUseCase } from '../application/registrar-jugador.use-case';
import { RegistrarJugadorDto } from '../application/registrar-jugador.dto';

@Controller('jugadores')
export class JugadoresController {
  constructor(private readonly registrarJugadorUseCase: RegistrarJugadorUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registrar(@Body() dto: RegistrarJugadorDto) {
    const jugador = await this.registrarJugadorUseCase.execute(dto);
    // Excluimos passwordHash de la respuesta
    const { passwordHash: _passwordHash, ...jugadorPublico } = jugador;
    return jugadorPublico;
  }
}
