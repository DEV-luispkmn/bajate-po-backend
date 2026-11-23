import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { LoginRateLimiterService } from './login-rate-limiter.service';

describe('LoginRateLimiterService', () => {
  let service: LoginRateLimiterService;

  beforeEach(() => {
    service = new LoginRateLimiterService();
  });

  it('permite intentos iniciales sin bloqueo', () => {
    expect(() => service.verificarBloqueo('operador@airsoft.cl')).not.toThrow();
  });

  it('cuenta intentos fallidos y avisa los intentos restantes antes del bloqueo', () => {
    // Intento 1
    try {
      service.registrarFallo('operador@airsoft.cl');
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.message).toContain('Te quedan 2 intentos');
    }

    // Intento 2
    try {
      service.registrarFallo('operador@airsoft.cl');
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.message).toContain('Te queda 1 intento');
    }
  });

  it('al tercer fallo consecutivo bloquea con status 429 y 60 segundos de cooldown', () => {
    expect(() => service.registrarFallo('operador@airsoft.cl')).toThrow(UnauthorizedException);
    expect(() => service.registrarFallo('operador@airsoft.cl')).toThrow(UnauthorizedException);

    // Intento 3
    try {
      service.registrarFallo('operador@airsoft.cl');
      throw new Error('Debió lanzar 429');
    } catch (err: any) {
      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(err.getResponse().segundosRestantes).toBe(60);
    }

    // Comprobar que verificarBloqueo bloquea de inmediato
    try {
      service.verificarBloqueo('operador@airsoft.cl');
      throw new Error('Debió estar bloqueado');
    } catch (err: any) {
      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it('es insensible a mayúsculas y espacios en el identificador', () => {
    expect(() => service.registrarFallo('  OPERADOR@Airsoft.CL ')).toThrow(UnauthorizedException);
    expect(() => service.registrarFallo('operador@airsoft.cl')).toThrow(UnauthorizedException);

    // Tercer intento con mayúsculas variadas
    try {
      service.registrarFallo('Operador@AIRSOFT.cl');
    } catch (err: any) {
      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it('el login exitoso resetea los intentos fallidos acumulados', () => {
    expect(() => service.registrarFallo('delta@airsoft.cl')).toThrow(UnauthorizedException);
    expect(() => service.registrarFallo('delta@airsoft.cl')).toThrow(UnauthorizedException);

    // Éxito
    service.registrarExito('delta@airsoft.cl');

    // Siguiente intento fallido vuelve a empezar desde 1 (quedan 2)
    try {
      service.registrarFallo('delta@airsoft.cl');
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.message).toContain('Te quedan 2 intentos');
    }
  });
});
