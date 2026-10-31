# Bájate Po — Backend

API backend de Bájate Po, construida con NestJS y TypeScript. El repositorio incluye la configuración de MySQL y el esquema de datos de Prisma.

> **Estado actual:** la aplicación NestJS tiene los módulos base de autenticación y jugadores, pero aún no expone endpoints. El esquema y la migración inicial de la base están preparados, aunque la API todavía no está conectada a Prisma.

## Stack

- **Node.js / TypeScript**
- **NestJS 12** con Express
- **MySQL 8**, ejecutado con Docker Compose
- **Prisma 7**: esquema y migraciones
- **Jest** y Supertest para pruebas
- **Helmet**, validación con `class-validator` y CORS

## Requisitos

- Node.js y npm.
- Docker Desktop con Docker Compose.
- Git.

## Preparar el entorno local

Los siguientes pasos asumen que `bajate-po-backend` y `docker-compose.yml` están dentro del mismo repositorio de trabajo.

### 1. Iniciar MySQL

Desde la carpeta raíz que contiene `docker-compose.yml`:

```bash
docker compose up -d mysql_bajatepo
```

El servicio crea la base `bajatepo_db` y publica el puerto `3306`. La configuración actual de Compose usa `root` como contraseña para desarrollo local; no reutilices esas credenciales en producción.

### 2. Configurar las variables de entorno

Crea o actualiza el archivo `.env` en `bajate-po-backend` con la URL de conexión. Sustituye los marcadores por las credenciales definidas en `docker-compose.yml`:

```dotenv
DATABASE_URL="mysql://<usuario>:<contraseña>@localhost:3306/bajatepo_db"
```

La URL debe coincidir con la configuración de MySQL local. No subas el archivo `.env` ni incluyas credenciales reales en el repositorio.

### 3. Instalar dependencias

Desde `bajate-po-backend`:

```bash
npm ci
```

### 4. Aplicar las migraciones

El proyecto ya incluye una migración inicial. Con MySQL en ejecución y `DATABASE_URL` configurada:

```bash
npx prisma migrate deploy
```

### 5. Iniciar el servidor

```bash
npm run start:dev
```

Por defecto, el servidor escucha en `http://localhost:3000`. El puerto se puede cambiar definiendo `PORT` en el entorno.

## Conectar desde la aplicación móvil

La app móvil aún no consume esta API. Cuando se implemente esa integración, usa el host correspondiente al entorno:

| Cliente | Host del backend |
| --- | --- |
| Emulador Android de Android Studio | `http://10.0.2.2:3000` |
| Simulador iOS | `http://localhost:3000` |
| Dispositivo físico | `http://<IP-local-del-equipo>:3000` |

Para un dispositivo físico, ambos equipos deben estar en la misma red. El backend habilita CORS, pero eso no sustituye la configuración de red ni hace que `localhost` del teléfono apunte a la computadora.

## Comandos disponibles

| Comando | Descripción |
| --- | --- |
| `npm run start` | Inicia el servidor |
| `npm run start:dev` | Inicia en modo desarrollo con recarga |
| `npm run start:debug` | Inicia en modo desarrollo con depuración |
| `npm run start:prod` | Ejecuta el servidor compilado en `dist` |
| `npm run build` | Compila el proyecto |
| `npm run lint` | Analiza `src/` y `test/` con Oxlint |
| `npm run format` | Formatea los archivos TypeScript de `src/` y `test/` |
| `npm run test` | Ejecuta las pruebas unitarias |
| `npm run test:e2e` | Ejecuta las pruebas end-to-end |
| `npm run test:cov` | Ejecuta las pruebas y genera cobertura |

## Modelo de datos

El esquema de Prisma está en `prisma/schema.prisma`. Incluye estos modelos:

- **Equipo** y **Jugador**
- **Cancha** y **Evento**
- **Bando** y **JugadorBando**
- **Partida** y **Ronda**

Los tipos de evento, privacidad, estado de evento, estado de partida y sincronización se definen como enumeraciones en el mismo esquema.

## Estructura principal

```text
bajate-po-backend/
├── prisma/
│   ├── migrations/       # Migraciones de la base
│   └── schema.prisma     # Modelos y relaciones
├── src/
│   ├── auth/             # Módulo base de autenticación
│   ├── jugadores/        # Módulo base de jugadores
│   ├── app.module.ts     # Módulo raíz
│   └── main.ts           # Inicio y configuración HTTP
├── test/                 # Pruebas end-to-end
├── .env                  # Variables locales (no subir al repositorio)
└── package.json
```

## Seguridad y validación HTTP

La configuración actual del servidor:

- Aplica cabeceras seguras con Helmet.
- Valida los DTO con `ValidationPipe`, rechaza propiedades no declaradas y transforma los datos de entrada.
- Habilita CORS para permitir solicitudes desde clientes móviles.

Antes de desplegar, configura credenciales y secretos seguros para el entorno de producción y restringe CORS a los orígenes que correspondan.

## Detener MySQL

Desde la carpeta raíz:

```bash
docker compose stop mysql_bajatepo
```

Los datos se guardan en el volumen `db_data` de Docker y persisten al detener el contenedor.
