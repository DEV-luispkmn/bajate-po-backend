import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.set('trust proxy', 1);

  // Aumentar el límite del body parser para admitir avatares y fotos tácticas en Base64
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));

  // 1. Seguridad de Cabeceras HTTP (compatible con recursos externos, WebSockets y proxy Ngrok)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          'connect-src': ["'self'", 'https:', 'wss:', 'http:', 'ws:'],
          'upgrade-insecure-requests': null,
        },
      },
    }),
  );

  // 2. Validación estricta de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos no definidos en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían campos extra
      transform: true, // Transforma los payloads a instancias de las clases DTO
    }),
  );

  // 3. Habilitar CORS para que la app móvil y ngrok puedan conectarse
  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = process.env.PORT ?? 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Servidor táctico Bájate Po! activo en http://0.0.0.0:${port}`);
}
bootstrap();
