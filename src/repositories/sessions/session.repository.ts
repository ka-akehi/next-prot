import { prisma } from '@infrastructure/persistence/prisma';
import type { Prisma } from '@prisma/client';

export function createSession(input: Prisma.SessionCreateInput) {
  return prisma.session.create({ data: input });
}
