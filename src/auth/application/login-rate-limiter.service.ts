import { Injectable, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';

interface RegistroIntentoLogin {
  intentosFallidos: number;
  bloqueadoHasta: number | null; // timestamp en ms
}

@Injectable()
export class LoginRateLimiterService {
  private readonly MAX_INTENTOS = 3;
  private readonly COOLDOWN_MS = 60 * 1000; // 1 minuto (60 segundos)
  private readonly intentos = new Map<string, RegistroIntentoLogin>();

  private normalizarClave(identificador: string): string {
    return identificador.trim().toLowerCase();
  }

  /**
   * Verifica si el identificador se encuentra actualmente en periodo de cooldown.
   * Lanza HttpException (429 TOO_MANY_REQUESTS) con los segundos restantes si está bloqueado.
   */
  verificarBloqueo(identificador: string): void {
    const key = this.normalizarClave(identificador);
    const registro = this.intentos.get(key);

    if (!registro || !registro.bloqueadoHasta) {
      return;
    }

    const ahora = Date.now();
    if (ahora < registro.bloqueadoHasta) {
      const segundosRestantes = Math.ceil((registro.bloqueadoHasta - ahora) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Demasiados intentos fallidos. Tu acceso está bloqueado temporalmente por seguridad. Espera ${segundosRestantes} segundo${segundosRestantes === 1 ? '' : 's'} antes de volver a intentar.`,
          segundosRestantes,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // El periodo de cooldown de 1 minuto ya expiró: resetear para permitir nuevos 3 intentos
    this.intentos.delete(key);
  }

  /**
   * Registra un intento de inicio de sesión fallido.
   * Si alcanza el máximo de 3 intentos continuos, aplica el bloqueo de 1 minuto.
   */
  registrarFallo(identificador: string, mensajeCustom?: string): void {
    const key = this.normalizarClave(identificador);
    const ahora = Date.now();
    const registro = this.intentos.get(key) || { intentosFallidos: 0, bloqueadoHasta: null };

    registro.intentosFallidos += 1;

    if (registro.intentosFallidos >= this.MAX_INTENTOS) {
      registro.bloqueadoHasta = ahora + this.COOLDOWN_MS;
      this.intentos.set(key, registro);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Has superado el límite de 3 intentos fallidos continuos. Tu acceso ha sido bloqueado por 1 minuto.',
          segundosRestantes: 60,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.intentos.set(key, registro);
    const intentosRestantes = this.MAX_INTENTOS - registro.intentosFallidos;
    const prefijo = mensajeCustom?.trim() || 'Credenciales inválidas.';

    throw new UnauthorizedException(
      `${prefijo} Te queda${intentosRestantes === 1 ? '' : 'n'} ${intentosRestantes} intento${intentosRestantes === 1 ? '' : 's'} antes del bloqueo de seguridad (1 minuto).`,
    );
  }

  /**
   * Registra un inicio de sesión exitoso, reseteando cualquier intento fallido acumulado.
   */
  registrarExito(identificador: string): void {
    const key = this.normalizarClave(identificador);
    this.intentos.delete(key);
  }

  /**
   * Utilidad para tests: limpia toda la memoria del limitador.
   */
  limpiar(): void {
    this.intentos.clear();
  }
}
