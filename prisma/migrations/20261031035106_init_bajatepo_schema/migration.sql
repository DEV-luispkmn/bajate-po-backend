-- CreateTable
CREATE TABLE `Equipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` TEXT NULL,
    `logoUrl` VARCHAR(255) NULL,
    `fechaFundacion` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jugador` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alias` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `rango` VARCHAR(50) NULL,
    `avatarUrl` VARCHAR(255) NULL,
    `equipoId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Jugador_alias_key`(`alias`),
    UNIQUE INDEX `Jugador_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cancha` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `latitud` DECIMAL(10, 8) NULL,
    `longitud` DECIMAL(11, 8) NULL,
    `adminEquipoId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Evento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(150) NOT NULL,
    `tipo` ENUM('PICHANGA', 'VERSUS', 'TORNEO', 'EVENTO_MASIVO') NOT NULL,
    `privacidad` ENUM('ABIERTO', 'CERRADO') NOT NULL,
    `canchaId` INTEGER NOT NULL,
    `organizadorId` INTEGER NOT NULL,
    `fechaInicio` DATETIME(3) NULL,
    `estado` ENUM('PROGRAMADO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO') NOT NULL DEFAULT 'PROGRAMADO',
    `codigoInvitacion` VARCHAR(20) NULL,

    UNIQUE INDEX `Evento_codigoInvitacion_key`(`codigoInvitacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bando` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventoId` INTEGER NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `colorHex` VARCHAR(7) NULL,
    `qrToken` VARCHAR(64) NULL,

    UNIQUE INDEX `Bando_qrToken_key`(`qrToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JugadorBando` (
    `eventoId` INTEGER NOT NULL,
    `jugadorId` INTEGER NOT NULL,
    `bandoId` INTEGER NOT NULL,
    `rol` VARCHAR(50) NOT NULL DEFAULT 'ASALTO',

    PRIMARY KEY (`eventoId`, `jugadorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Partida` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventoId` INTEGER NOT NULL,
    `nombre` VARCHAR(100) NULL,
    `estado` ENUM('PENDIENTE', 'EN_CURSO', 'FINALIZADA') NOT NULL DEFAULT 'PENDIENTE',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ronda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partidaId` INTEGER NOT NULL,
    `numeroRonda` INTEGER NOT NULL,
    `bandoGanadorId` INTEGER NULL,
    `estadoSync` ENUM('PENDIENTE_SYNC', 'SINCRONIZADO') NOT NULL DEFAULT 'SINCRONIZADO',
    `fechaRegistro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Jugador` ADD CONSTRAINT `Jugador_equipoId_fkey` FOREIGN KEY (`equipoId`) REFERENCES `Equipo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cancha` ADD CONSTRAINT `Cancha_adminEquipoId_fkey` FOREIGN KEY (`adminEquipoId`) REFERENCES `Equipo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evento` ADD CONSTRAINT `Evento_canchaId_fkey` FOREIGN KEY (`canchaId`) REFERENCES `Cancha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evento` ADD CONSTRAINT `Evento_organizadorId_fkey` FOREIGN KEY (`organizadorId`) REFERENCES `Jugador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bando` ADD CONSTRAINT `Bando_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Evento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JugadorBando` ADD CONSTRAINT `JugadorBando_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Evento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JugadorBando` ADD CONSTRAINT `JugadorBando_jugadorId_fkey` FOREIGN KEY (`jugadorId`) REFERENCES `Jugador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JugadorBando` ADD CONSTRAINT `JugadorBando_bandoId_fkey` FOREIGN KEY (`bandoId`) REFERENCES `Bando`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida` ADD CONSTRAINT `Partida_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Evento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ronda` ADD CONSTRAINT `Ronda_partidaId_fkey` FOREIGN KEY (`partidaId`) REFERENCES `Partida`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ronda` ADD CONSTRAINT `Ronda_bandoGanadorId_fkey` FOREIGN KEY (`bandoGanadorId`) REFERENCES `Bando`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
