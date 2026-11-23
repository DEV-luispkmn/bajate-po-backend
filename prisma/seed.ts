import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

let connectionUrl =
  process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/bajatepo_db?allowPublicKeyRetrieval=true';

if (!connectionUrl.includes('allowPublicKeyRetrieval=true')) {
  const sep = connectionUrl.includes('?') ? '&' : '?';
  connectionUrl = `${connectionUrl}${sep}allowPublicKeyRetrieval=true`;
}

const adapter = new PrismaMariaDb(connectionUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- SEMBRANDO MODALIDADES DE PARTIDA ---');
  const modalidades = [
    {
      codigo: 'TDM',
      nombre: 'Duelo por Equipos (TDM)',
      descripcion: 'Dos bandos se enfrentan a eliminación directa o recuento de impactos.',
      reglas: 'Cada operador impactado debe cantar su baja ("¡BÁJATE PO!"), sacar pañuelo rojo e ir al respawn.',
      icono: 'sword-cross',
    },
    {
      codigo: 'DOMINACION',
      nombre: 'Control de Puntos (Dominación)',
      descripcion: 'Captura y defensa de 3 sectores estratégicos (Alpha, Bravo y Charlie).',
      reglas: 'El equipo acumula puntos por cada minuto que mantenga la bandera en su color.',
      icono: 'flag-triangle',
    },
    {
      codigo: 'CTF',
      nombre: 'Captura de Bandera (CTF)',
      descripcion: 'Infiltra el perímetro enemigo, roba su bandera y extráela a tu campamento.',
      reglas: 'Solo se anota punto si tu propia bandera sigue en tu base.',
      icono: 'flag',
    },
    {
      codigo: 'BUSCAR_DESTRUIR',
      nombre: 'Buscar y Destruir (S&D)',
      descripcion: 'Un bando debe plantar el maletín/bomba en el polvorín enemigo.',
      reglas: 'Sin respawn durante la ronda. Se gana eliminando al bando o detonando/desactivando el artefacto.',
      icono: 'bomb',
    },
    {
      codigo: 'RESCATE_REHEN',
      nombre: 'Rescate de Rehén / VIP',
      descripcion: 'Localiza y escolta al VIP hasta el punto de extracción.',
      reglas: 'El VIP solo puede portar pistola o chaleco reflejante.',
      icono: 'account-alert',
    },
    {
      codigo: 'REY_DE_LA_COLINA',
      nombre: 'Rey de la Colina',
      descripcion: 'Control absoluto del búnker central fortificado bajo fuego cruzado.',
      reglas: 'El equipo que sume más tiempo dentro del perímetro gana la partida.',
      icono: 'crown',
    },
  ];

  for (const m of modalidades) {
    await prisma.modalidadPartida.upsert({
      where: { codigo: m.codigo },
      update: m,
      create: m,
    });
  }

  console.log('--- SEMBRANDO ROLES TÁCTICOS ---');
  const roles = [
    {
      codigo: 'ASALTO',
      nombre: 'Asalto',
      descripcion: 'Punta de lanza táctica en combate abierto y medio alcance.',
      icono: 'lightning-bolt',
    },
    {
      codigo: 'CQB',
      nombre: 'CQB (Combate Cerrado)',
      descripcion: 'Especialista en asalto a recintos cerrados, pasillos y edificaciones.',
      icono: 'door-open',
    },
    {
      codigo: 'SNIPER',
      nombre: 'Francotirador (Sniper)',
      descripcion: 'Tirador certero de cerrojo, camuflaje e interdicción a larga distancia.',
      icono: 'crosshairs',
    },
    {
      codigo: 'DMR',
      nombre: 'Tirador Designado (DMR)',
      descripcion: 'Fuego de precisión semi-automático entre el asalto y el francotirador.',
      icono: 'telescope',
    },
    {
      codigo: 'APOYO',
      nombre: 'Apoyo / Artillero',
      descripcion: 'Fuego de supresión continuo con réplica pesada / LMG.',
      icono: 'shield-plus',
    },
    {
      codigo: 'MEDICO',
      nombre: 'Médico Táctico',
      descripcion: 'Reanimación y soporte en combate para devolver operadores al juego.',
      icono: 'medical-bag',
    },
  ];

  for (const r of roles) {
    await prisma.rolTactico.upsert({
      where: { codigo: r.codigo },
      update: r,
      create: r,
    });
  }

  console.log('--- SEMBRANDO RANGOS Y APODOS TÁCTICOS DE CANCHA ---');
  const rangos = [
    {
      orden: 1,
      codigo: 'PICHON',
      nombre: 'Pichón',
      puntosRequeridos: 0,
      logrosRequeridos: 0,
      descripcion: 'Operador novato en sus primeras partidas de fogueo, recibiendo sus primeros balinazos en la cancha.',
    },
    {
      orden: 2,
      codigo: 'COMBATIENTE',
      nombre: 'Combatiente de Línea',
      puntosRequeridos: 200,
      logrosRequeridos: 1,
      descripcion: 'Ya pasó su bautizo de fuego, va al frente sin miedo y canta sus bajas con orgullo.',
    },
    {
      orden: 3,
      codigo: 'PUNTA_DE_LANZA',
      nombre: 'Punta de Lanza',
      puntosRequeridos: 500,
      logrosRequeridos: 2,
      descripcion: 'Asaltante agresivo, rushea esquinas, despeja habitaciones y rompe las líneas enemigas.',
    },
    {
      orden: 4,
      codigo: 'CAMPERO',
      nombre: 'Campero Táctico',
      puntosRequeridos: 1000,
      logrosRequeridos: 4,
      descripcion: 'Paciencia legendaria en los matorrales; espera el momento justo para emboscar escuadras completas.',
    },
    {
      orden: 5,
      codigo: 'FRANCOTIRADOR',
      nombre: 'Francotirador',
      puntosRequeridos: 2000,
      logrosRequeridos: 6,
      descripcion: 'Tirador certero de cerrojo y mira telescópica: un balín, una baja confirmada a 70 metros.',
    },
    {
      orden: 6,
      codigo: 'FANTASMA',
      nombre: 'Fantasma',
      puntosRequeridos: 3500,
      logrosRequeridos: 8,
      descripcion: 'Infiltrador sigiloso; nadie lo ve ni lo escucha hasta que todo el flanco contrario está en el respawn.',
    },
    {
      orden: 7,
      codigo: 'LOBO_SOLITARIO',
      nombre: 'Lobo Solitario',
      puntosRequeridos: 5500,
      logrosRequeridos: 10,
      descripcion: 'Operador todoterreno e independiente, capaz de ganar partidas completas jugando solo por el flanco ciego.',
    },
    {
      orden: 8,
      codigo: 'VETERANO',
      nombre: 'Veterano de Cancha',
      puntosRequeridos: 8000,
      logrosRequeridos: 12,
      descripcion: 'Curtido en cientos de partidas, torneos y versus en todas las canchas de Chile. Voz de mando y respeto.',
    },
    {
      orden: 9,
      codigo: 'INMORTAL',
      nombre: 'Leyenda / Inmortal',
      puntosRequeridos: 12000,
      logrosRequeridos: 15,
      descripcion: 'Máximo estatus y honor en la comunidad de airsoft nacional. Un verdadero mito viviente del deporte.',
    },
  ];

  const rangosCreados: Record<string, number> = {};
  for (const r of rangos) {
    const res = await prisma.rangoMilitar.upsert({
      where: { orden: r.orden },
      update: r,
      create: r,
    });
    rangosCreados[r.codigo] = res.id;
  }

  console.log('--- SEMBRANDO LOGROS E HITOS MILITARES ---');
  const logros = [
    {
      codigo: 'BAUTIZO_FUEGO',
      nombre: 'Bautizo de Fuego',
      descripcion: 'Despliégate y participa en tu primera partida de airsoft.',
      icono: 'fire',
      puntosOtorgados: 100,
      hitoTipo: 'PARTIDAS_JUGADAS',
      metaHito: 1,
      rangoDesbloqueadoId: rangosCreados['COMBATIENTE'],
    },
    {
      codigo: 'VETERANO_BRONCE',
      nombre: 'Veterano de Bronce',
      descripcion: 'Participa en al menos 5 partidas de combate.',
      icono: 'shield-check',
      puntosOtorgados: 250,
      hitoTipo: 'PARTIDAS_JUGADAS',
      metaHito: 5,
      rangoDesbloqueadoId: rangosCreados['PUNTA_DE_LANZA'],
    },
    {
      codigo: 'COMANDANTE_ESCUADRON',
      nombre: 'Comandante de Escuadrón',
      descripcion: 'Convoca y organiza tu primera partida en Bájate Po!.',
      icono: 'crown',
      puntosOtorgados: 300,
      hitoTipo: 'EVENTOS_ORGANIZADOS',
      metaHito: 1,
    },
    {
      codigo: 'VICTORIA_TACTICA',
      nombre: 'Victoria Táctica',
      descripcion: 'Gana tu primera ronda de combate oficial con tu bando.',
      icono: 'trophy',
      puntosOtorgados: 150,
      hitoTipo: 'RONDAS_GANADAS',
      metaHito: 1,
    },
    {
      codigo: 'MEDICO_SALVADOR',
      nombre: 'Ángel de Combate',
      descripcion: 'Completa operaciones enlistado con el rol táctico de Médico.',
      icono: 'medical-bag',
      puntosOtorgados: 200,
      hitoTipo: 'PARTIDAS_MEDICO',
      metaHito: 3,
    },
    {
      codigo: 'VETERANO_PLATA',
      nombre: 'Veterano de Plata',
      descripcion: 'Completa 10 operaciones de combate en terreno.',
      icono: 'medal',
      puntosOtorgados: 500,
      hitoTipo: 'PARTIDAS_JUGADAS',
      metaHito: 10,
      rangoDesbloqueadoId: rangosCreados['CAMPERO'],
    },
    {
      codigo: 'ESTRATEGA_ORO',
      nombre: 'Estratega de Oro',
      descripcion: 'Lidera o gana 15 rondas en partidas oficiales.',
      icono: 'star',
      puntosOtorgados: 750,
      hitoTipo: 'RONDAS_GANADAS',
      metaHito: 15,
      rangoDesbloqueadoId: rangosCreados['FRANCOTIRADOR'],
    },
    {
      codigo: 'INQUEBRANTABLE',
      nombre: 'Operador Inquebrantable',
      descripcion: 'Participa en 25 partidas en distintas canchas y regiones de Chile.',
      icono: 'shield-crown',
      puntosOtorgados: 1000,
      hitoTipo: 'PARTIDAS_JUGADAS',
      metaHito: 25,
      rangoDesbloqueadoId: rangosCreados['VETERANO'],
    },
  ];

  for (const l of logros) {
    await prisma.logro.upsert({
      where: { codigo: l.codigo },
      update: l,
      create: l,
    });
  }

  console.log('--- SEMBRANDO EQUIPOS TÁCTICOS EMBLEMÁTICOS ---');
  const equiposIniciales = [
    {
      nombre: 'Fuerza Especial Delta',
      lema: 'Disciplina, Honor y Precisión Quirúrgica',
      descripcion: 'Escuadra táctica especializada en asaltos rápidos y operaciones CQB en recintos cerrados.',
      region: 'Región Metropolitana',
      ciudad: 'Santiago',
      logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
      codigoAcceso: 'FDEL01',
    },
    {
      nombre: 'Comando Cóndores del Sur',
      lema: 'Desde las alturas dominamos el valle',
      descripcion: 'Equipo de tiradores designados, emboscadas y patrullas de reconocimiento en bosque denso.',
      region: 'Región de la Araucanía',
      ciudad: 'Temuco',
      logoUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400',
      codigoAcceso: 'COND02',
    },
    {
      nombre: 'Black Wolves Valparaíso',
      lema: 'Cazamos en manada, nunca retrocedemos',
      descripcion: 'Operadores veteranos de la V Región con amplia trayectoria en torneos MILSIM y speedsoft.',
      region: 'Región de Valparaíso',
      ciudad: 'Viña del Mar',
      logoUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
      codigoAcceso: 'BWLV03',
    },
  ];

  for (const eq of equiposIniciales) {
    const existe = await prisma.equipo.findFirst({ where: { nombre: eq.nombre } });
    if (!existe) {
      await prisma.equipo.create({
        data: {
          ...eq,
          fechaFundacion: new Date('2022-03-15'),
        },
      });
    }
  }

  console.log('✅ Base de datos sembrada con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
