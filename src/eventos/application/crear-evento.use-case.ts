import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { EVENTO_REPOSITORY } from '../domain/evento.repository.interface';
import type { IEventoRepository } from '../domain/evento.repository.interface';
import { CANCHA_REPOSITORY } from '../../canchas/domain/cancha.repository.interface';
import type { ICanchaRepository } from '../../canchas/domain/cancha.repository.interface';
import { CrearEventoDto } from './crear-evento.dto';
import { Evento } from '../domain/evento.entity';

function generarCodigoMnemotecnico(nombreCancha: string): string {
  const limpio = (nombreCancha || 'CAMPO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '');

  const palabras = limpio.split(/\s+/).filter(Boolean);
  let prefijo = '';

  if (palabras.length >= 2) {
    // Si tiene 2 o más palabras (ej: "FUERTE BULNES" -> "FUEB")
    const p1 = palabras[0].slice(0, 2);
    const p2 = palabras[1].slice(0, 2);
    prefijo = `${p1}${p2}`.padEnd(3, 'X').slice(0, 4);
  } else if (palabras.length === 1) {
    // Si tiene 1 palabra (ej: "MASADA" -> "MAS")
    prefijo = palabras[0].slice(0, 3).padEnd(3, 'A');
  } else {
    prefijo = 'AIR';
  }

  const digitosFaltantes = 6 - prefijo.length;
  const min = Math.pow(10, digitosFaltantes - 1);
  const max = Math.pow(10, digitosFaltantes) - 1;
  const numRandom = Math.floor(min + Math.random() * (max - min + 1));

  return `${prefijo}${numRandom}`;
}

@Injectable()
export class CrearEventoUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
    @Inject(CANCHA_REPOSITORY)
    private readonly canchaRepository: ICanchaRepository,
  ) {}

  async execute(dto: CrearEventoDto, organizadorId: number): Promise<Evento> {
    const ahora = new Date();

    if (dto.fechaInicio) {
      const inicio = new Date(dto.fechaInicio);
      if (isNaN(inicio.getTime())) {
        throw new BadRequestException('La fecha y hora de inicio no tiene un formato válido.');
      }
      // Tolerancia de 60 segundos por latencia de red entre cliente y servidor
      if (inicio.getTime() < ahora.getTime() - 60000) {
        throw new BadRequestException(
          'No se puede crear una partida para una fecha anterior a la actual.',
        );
      }
    }

    if (dto.fechaFin) {
      const fin = new Date(dto.fechaFin);
      if (isNaN(fin.getTime())) {
        throw new BadRequestException('La fecha y hora de término no tiene un formato válido.');
      }
      if (dto.fechaInicio) {
        const inicio = new Date(dto.fechaInicio);
        if (fin.getTime() <= inicio.getTime()) {
          throw new BadRequestException(
            'La fecha y hora de término debe ser posterior a la fecha y hora de inicio.',
          );
        }
      } else if (fin.getTime() < ahora.getTime()) {
        throw new BadRequestException(
          'La fecha y hora de término no puede ser anterior a la fecha actual.',
        );
      }
    }

    let cancha = null;
    if (dto.canchaId) {
      cancha = await this.canchaRepository.findById(dto.canchaId);
      if (!cancha) {
        throw new NotFoundException(`La cancha con ID ${dto.canchaId} no existe`);
      }
    } else if (dto.tipo !== 'EVENTO_MASIVO') {
      throw new BadRequestException('Para modalidades Pichanga o Versus es obligatorio seleccionar una cancha.');
    }

    const region = dto.region || cancha?.region || 'Metropolitana';
    const ciudad = dto.ciudad || cancha?.ciudad || 'Santiago';

    // Generar código de invitación mnemotécnico escalable de 6 caracteres (ej: MAS123 o FUEB12)
    const nombreReferencia = cancha ? cancha.nombre : (dto.titulo || 'MILSIM');
    let codigoInvitacion = generarCodigoMnemotecnico(nombreReferencia);
    let existe = await this.eventoRepository.findByCodigoInvitacion(codigoInvitacion);
    let intentos = 0;
    while (existe && intentos < 10) {
      codigoInvitacion = generarCodigoMnemotecnico(nombreReferencia);
      existe = await this.eventoRepository.findByCodigoInvitacion(codigoInvitacion);
      intentos++;
    }

    // Configuración de bandos según el tipo de evento
    let bandosInput: { nombre: string; colorHex?: string }[] = [];

    if (dto.tipo === 'VERSUS') {
      const equipos = await this.eventoRepository.listarEquipos();
      const equipoA = equipos.find((e) => e.id === dto.equipoAId);
      const equipoB = equipos.find((e) => e.id === dto.equipoBId);

      bandosInput = [
        {
          nombre: equipoA ? equipoA.nombre : 'Equipo Local',
          colorHex: '#E53E3E',
        },
        {
          nombre: equipoB ? equipoB.nombre : 'Equipo Visitante',
          colorHex: '#3182CE',
        },
      ];
    } else if (dto.tipo === 'EVENTO_MASIVO') {
      // Milsim / Combat Mission temático
      bandosInput =
        dto.bandos && dto.bandos.length >= 2
          ? dto.bandos
          : [
              { nombre: 'Fuerzas Especiales (TF)', colorHex: '#4A5568' },
              { nombre: 'Insurgencia Rebelde', colorHex: '#D69E2E' },
            ];
    } else {
      // Pichanga: bandos estándar o dinámicos
      bandosInput =
        dto.bandos && dto.bandos.length >= 2
          ? dto.bandos
          : [
              { nombre: 'Bando Alfa', colorHex: '#E53E3E' },
              { nombre: 'Bando Bravo', colorHex: '#3182CE' },
            ];
    }

    const bandosConQr = bandosInput.map((b: any) => ({
      nombre: b.nombre,
      colorHex: b.colorHex,
      qrToken: `bando_${randomBytes(16).toString('hex')}`,
      cupoMax: b.cupoMax ? Number(b.cupoMax) : null,
      frecuenciaRadio: b.frecuenciaRadio,
      subtonoRadio: b.subtonoRadio,
    }));

    const privacidadFinal = dto.tipo === 'VERSUS' ? 'CERRADO' : dto.privacidad;

    const eventoCreado = await this.eventoRepository.create({
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      tipo: dto.tipo,
      privacidad: privacidadFinal,
      canchaId: dto.canchaId ?? null,
      latitud: dto.latitud ?? null,
      longitud: dto.longitud ?? null,
      direccionTexto: dto.direccionTexto ?? null,
      mapaTacticoUrl: dto.mapaTacticoUrl ?? (cancha?.mapaTacticoUrl ?? null),
      mapaPines: dto.mapaPines ?? null,
      organizadorId,
      fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : undefined,
      fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
      region,
      ciudad,
      equipoAId: dto.equipoAId,
      equipoBId: dto.equipoBId,
      codigoInvitacion,
      bandos: bandosConQr,
      inscripcionesAbiertas: true,
    });

    // Si es EVENTO_MASIVO o se enviaron TACSOP y Fases, inicializarlos
    if (dto.tipo === 'EVENTO_MASIVO' || dto.tacsop) {
      if (dto.tacsop && this.eventoRepository.guardarTacsop) {
        await this.eventoRepository.guardarTacsop(eventoCreado.id, dto.tacsop);
      }
      if (dto.fases && dto.fases.length > 0 && this.eventoRepository.crearFase) {
        for (const fase of dto.fases) {
          await this.eventoRepository.crearFase(eventoCreado.id, fase);
        }
      }
    }

    // Si el creador eligió su rol, se le inscribe en su respectivo bando
    if (dto.rolOrganizador && eventoCreado.bandos && eventoCreado.bandos.length > 0) {
      let bandoIndex =
        dto.bandoOrganizadorIndex !== undefined &&
        dto.bandoOrganizadorIndex < eventoCreado.bandos.length
          ? dto.bandoOrganizadorIndex
          : 0;

      if (dto.tipo === 'VERSUS') {
        const organizadorEquipoId = await this.eventoRepository.findJugadorEquipoId(organizadorId);
        if (organizadorEquipoId && dto.equipoBId && organizadorEquipoId === dto.equipoBId) {
          bandoIndex = 1;
        } else if (organizadorEquipoId && dto.equipoAId && organizadorEquipoId === dto.equipoAId) {
          bandoIndex = 0;
        }
      }

      const bandoId = eventoCreado.bandos[bandoIndex].id;

      await this.eventoRepository.unirJugadorABando(
        eventoCreado.id,
        organizadorId,
        bandoId,
        dto.rolOrganizador,
      );
    }

    return eventoCreado;
  }
}
