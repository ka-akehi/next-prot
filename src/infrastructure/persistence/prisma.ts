import { getEnvString } from '@/shared/env';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [],
  });

if (getEnvString('NODE_ENV', '') !== 'production') globalForPrisma.prisma = prisma;
