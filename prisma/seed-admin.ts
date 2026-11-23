import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaService();

async function main() {
  await prisma.jugador.updateMany({
    data: { esAdmin: true },
  });
  const jugadores = await prisma.jugador.findMany({
    select: { id: true, alias: true, email: true, esAdmin: true },
  });
  console.log('Operadores con privilegios de Administrador configurados:', jugadores);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
