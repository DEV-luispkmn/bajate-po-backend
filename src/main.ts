import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Seguridad de Cabeceras HTTP
  app.use(helmet());

  // 2. Validación estricta de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos no definidos en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían campos extra
      transform: true, // Transforma los payloads a instancias de las clases DTO
    }),
  );

  // 3. Habilitar CORS para que la app móvil pueda conectarse
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();