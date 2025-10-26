import { prisma } from '@infrastructure/persistence/prisma';
import { Prisma } from '@prisma/client';

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function findUserByEmailCandidates(emails: string[]) {
  return prisma.user.findFirst({
    where: {
      email: {
        in: emails,
      },
    },
  });
}

export function updateUserById(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export function createUser(input: Prisma.UserCreateInput) {
  return prisma.user.create({ data: input });
}

export function upsertUserByEmail(email: string, create: Prisma.UserCreateInput, update: Prisma.UserUpdateInput) {
  return prisma.user.upsert({
    where: { email },
    create: create,
    update: update,
  });
}

export async function findMostRelevantUserByEmail(email: string) {
  const [existingUser] = await prisma.$queryRaw<
    Array<{
      id: string;
      email: string | null;
      passwordHash: string | null;
    }>
  >(Prisma.sql`
    SELECT "id", "email", "passwordHash"
    FROM "User"
    WHERE LOWER("email") = LOWER(${email})
    ORDER BY CASE WHEN "passwordHash" IS NULL THEN 1 ELSE 0 END,
             "createdAt" DESC
    LIMIT 1
  `);

  return existingUser ?? null;
}
