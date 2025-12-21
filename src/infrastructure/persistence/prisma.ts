import { getEnvString } from '@/shared/env';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = getEnvString('DATABASE_URL', '');

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const libsqlConfig = { url: databaseUrl };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaLibSql(libsqlConfig),
    log: [],
  });

if (getEnvString('NODE_ENV', '') !== 'production') globalForPrisma.prisma = prisma;
