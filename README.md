# Bájate Po — Backend

API REST y servidor de WebSockets de **Bájate Po**, construido con NestJS, TypeScript, Prisma 7 y MySQL 8 bajo arquitectura hexagonal (`domain`, `application`, `infrastructure`).

Además de exponer la API para la aplicación móvil y el panel administrativo, si existe la compilación `../bajate-po-admin/dist`, el backend sirve automáticamente el panel web en `/admin`.

## Stack

- **Node.js / TypeScript**
- **NestJS 12** con Express y `@nestjs/serve-static`
- **MySQL 8** con Docker Compose
- **Prisma 7** con `@prisma/adapter-mariadb`
- **Autenticación y seguridad:** JWT (`@nestjs/jwt` + Passport), `bcrypt`, rate limiter en login, `Helmet`, `class-validator` y CORS
- **Tiempo real:** Socket.io (`@nestjs/websockets`, `@nestjs/platform-socket.io`)
- **Calidad y pruebas:** Jest, Supertest, Oxlint y Prettier

## Módulos implementados

- **`auth`:** login por correo o alias/callsign, emisión JWT, `JwtAuthGuard`, `AdminGuard` y protección por intentos fallidos (`LoginRateLimiterService`).
- **`jugadores`:** registro de operadores y consulta/edición de ficha completa (rango, logros, roles, historial y avatar).
- **`equipos`:** creación, edición, códigos de invitación, asignación de Team Leader (TL), flujo completo de postulaciones y disolución con desactivación de la cancha asociada al equipo.
- **`canchas`:** alta con coordenadas GPS y fotografías, filtros por región y modalidad (abierta o de equipo), edición y moderación.
- **`eventos`:** creación en pasos (pichangas, versus entre escuadras y eventos masivos/milsim), bandos, escuadras, inscripciones, coorganizadores, TACSOP, fases de evento, cronometraje de réplicas, misiones y líderes de bando.
- **`partidas`:** creación, unión por código, registro de rondas en vivo y sincronización offline, votación MVP y evaluación de fama.
- **`notificaciones`:** persistencia REST y emisión en tiempo real vía Socket.io.
- **`configuracion`:** catálogos de modalidades, roles, rangos y logros, preferencias de notificaciones y buzón de tickets (`IDEA`, `SUGERENCIA`, `PROBLEMA`, `CANCHA`, `OTRO`) con soporte `LONGTEXT` para evidencias adjuntas.
- **`admin`:** endpoints protegidos para estadísticas generales, moderación/reasignación de canchas, gestión de equipos y operadores, y respuesta a tickets.

## Requisitos

- Node.js y npm
- Docker Desktop con Docker Compose
- Git

## Preparar el entorno local

Los siguientes pasos asumen que `bajate-po-backend` y `docker-compose.yml` están dentro del mismo directorio de trabajo.

### 1. Iniciar MySQL

Desde la carpeta raíz que contiene `docker-compose.yml`:

```bash
docker compose up -d mysql_bajatepo
```

El servicio crea la base `bajatepo_db` y publica el puerto `3306`. No reutilices credenciales de desarrollo local en producción.

### 2. Configurar las variables de entorno

Crea el archivo `.env` dentro de `bajate-po-backend` con tus valores locales:

```dotenv
DATABASE_URL="mysql://<usuario>:<contraseña>@localhost:3306/bajatepo_db"
JWT_SECRET="<clave-secreta-jwt>"
PORT=8080
```

No subas el archivo `.env` ni incluyas credenciales reales en el repositorio.

### 3. Instalar dependencias

Desde `bajate-po-backend`:

```bash
npm ci
```

### 4. Sincronizar base de datos y generar Prisma Client

Con MySQL activo y `DATABASE_URL` configurada:

```bash
npx prisma migrate deploy
npx prisma generate
```

En entorno de desarrollo local también puedes sincronizar cambios del esquema directamente con `npx prisma db push`.

Opcionalmente, para cargar catálogos iniciales (modalidades, roles, rangos, logros y equipos base):

```bash
npx ts-node prisma/seed.ts
```

### 5. Iniciar el servidor

```bash
npm run start:dev
```

Por defecto, el servidor escucha en `http://localhost:8080` (configurable mediante `PORT`).

## Conectar desde clientes (móvil y web)

| Cliente | URL del backend |
| --- | --- |
| Panel web local (`bajate-po-admin`) | `http://localhost:8080` |
| Emulador Android de Android Studio | `http://10.0.2.2:8080` |
| Simulador iOS | `http://localhost:8080` |
| Dispositivo móvil físico | `http://<IP-local-del-equipo>:8080` |

Para dispositivos físicos en red local, ambos equipos deben estar en la misma red Wi-Fi.

## Comandos disponibles

| Comando | Descripción |
| --- | --- |
| `npm run start` | Inicia el servidor |
| `npm run start:dev` | Inicia en modo desarrollo con recarga |
| `npm run start:debug` | Inicia en modo desarrollo con depuración |
| `npm run start:prod` | Ejecuta el servidor compilado en `dist` |
| `npm run build` | Compila el proyecto con Nest CLI |
| `npm run lint` | Analiza `src/` y `test/` con Oxlint |
| `npm run format` | Formatea los archivos TypeScript con Prettier |
| `npm run test` | Ejecuta las pruebas unitarias con Jest |
| `npm run test:e2e` | Ejecuta las pruebas end-to-end |
| `npm run test:cov` | Ejecuta las pruebas y genera reporte de cobertura |

## Modelo de datos

El esquema completo está en `prisma/schema.prisma` e incluye, entre otros:

- **Identidad y progresión:** `Jugador`, `RangoMilitar`, `Logro`, `JugadorLogro`, `RolTactico`
- **Equipos y reclutamiento:** `Equipo`, `PostulacionEquipo`
- **Campos de juego:** `Cancha`, `CanchaFoto`
- **Eventos y milsim:** `Evento`, `OrganizadorEvento`, `Bando`, `Escuadra`, `JugadorBando`, `EventoTacsop`, `FaseEvento`, `RegistroCronoReplica`, `MisionEvento`
- **Partidas y reputación:** `Partida`, `JugadorPartida`, `Ronda`, `ModalidadPartida`, `VotoMvpPartida`, `EvaluacionFama`
- **Comunicación y soporte:** `Notificacion`, `TicketSoporte` (`mensaje` en `@db.LongText`)

## Estructura principal

```text
bajate-po-backend/
├── prisma/
│   ├── migrations/           # Migraciones versionadas
│   ├── schema.prisma         # Modelos y relaciones de base de datos
│   ├── seed.ts               # Carga inicial de catálogos y equipos base
│   └── seed-admin.ts         # Script auxiliar de permisos admin
├── src/
│   ├── admin/                # Endpoints del panel web administrativo
│   ├── auth/                 # Login, JWT, AdminGuard y rate limiter
│   ├── canchas/              # Gestión y moderación de campos
│   ├── configuracion/        # Catálogos y tickets de soporte
│   ├── equipos/              # Equipos, TL y postulaciones
│   ├── eventos/              # Eventos, fases, TACSOP, crono y misiones
│   ├── jugadores/            # Registro y perfil de operadores
│   ├── notificaciones/       # Gateway Socket.io y notificaciones REST
│   ├── partidas/             # Partidas en vivo, rondas, MVP y fama
│   ├── prisma/               # PrismaService global
│   ├── app.module.ts         # Módulo raíz y estáticos de /admin
│   └── main.ts               # Arranque HTTP, Helmet, CORS y pipes
├── test/                     # Pruebas end-to-end
├── .env                      # Variables locales (no subir al repositorio)
└── package.json
```

## Seguridad y validación HTTP

- Aplica cabeceras seguras con `Helmet`.
- Valida DTOs con `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
- Limita intentos reiterados de login mediante `LoginRateLimiterService`.
- Configura límite de payload JSON/urlencoded de `25mb` para imágenes en Base64.
- Habilita CORS para clientes móviles y panel administrativo.

## Detener MySQL

Desde la carpeta raíz:

```bash
docker compose stop mysql_bajatepo
```

Los datos se conservan en el volumen `db_data` de Docker.
