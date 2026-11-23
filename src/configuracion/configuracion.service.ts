import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearTicketDto } from './dto/crear-ticket.dto';

@Injectable()
export class ConfiguracionService {
  constructor(private readonly prisma: PrismaService) {}

  async listarModalidades() {
    return this.prisma.modalidadPartida.findMany({
      where: { activa: true },
      orderBy: { id: 'asc' },
    });
  }

  async listarRoles() {
    return this.prisma.rolTactico.findMany({
      where: { activo: true },
      orderBy: { id: 'asc' },
    });
  }

  async listarRangos() {
    return this.prisma.rangoMilitar.findMany({
      orderBy: { orden: 'asc' },
      include: {
        logrosDesbloquean: true,
      },
    });
  }

  async listarLogros() {
    return this.prisma.logro.findMany({
      orderBy: { id: 'asc' },
      include: {
        rangoDesbloqueado: true,
      },
    });
  }

  async crearTicket(dto: CrearTicketDto, jugadorId: number) {
    return this.prisma.ticketSoporte.create({
      data: {
        jugadorId,
        tipo: dto.tipo,
        titulo: dto.titulo,
        mensaje: dto.mensaje,
      },
    });
  }

  async listarMisTickets(jugadorId: number) {
    return this.prisma.ticketSoporte.findMany({
      where: { jugadorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async actualizarNotificaciones(recibeNotificaciones: boolean, jugadorId: number) {
    const jugador = await this.prisma.jugador.findUnique({
      where: { id: jugadorId },
    });
    if (!jugador) {
      throw new NotFoundException('Jugador no encontrado');
    }

    return this.prisma.jugador.update({
      where: { id: jugadorId },
      data: { recibeNotificaciones },
      select: {
        id: true,
        alias: true,
        recibeNotificaciones: true,
      },
    });
  }
}
