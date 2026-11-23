import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    let connectionUrl =
      process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/bajatepo_db';

    // Asegurar allowPublicKeyRetrieval=true para autenticación segura en MySQL 8 (caching_sha2_password)
    try {
      const parsed = new URL(connectionUrl);
      if (!parsed.searchParams.has('allowPublicKeyRetrieval')) {
        parsed.searchParams.set('allowPublicKeyRetrieval', 'true');
      }
      connectionUrl = parsed.toString();
    } catch {
      if (!connectionUrl.includes('allowPublicKeyRetrieval=true')) {
        const sep = connectionUrl.includes('?') ? '&' : '?';
        connectionUrl = `${connectionUrl}${sep}allowPublicKeyRetrieval=true`;
      }
    }

    const adapter = new PrismaMariaDb(connectionUrl);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
