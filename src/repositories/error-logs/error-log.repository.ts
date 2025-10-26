import { prisma } from '@infrastructure/persistence/prisma';
import type { Prisma } from '@prisma/client';

export function createServerErrorLog(input: Prisma.ServerErrorLogCreateInput) {
  return prisma.serverErrorLog.create({ data: input });
}

export function createClientErrorLog(input: Prisma.ClientErrorLogCreateInput) {
  return prisma.clientErrorLog.create({ data: input });
}

export function findServerErrorLogs(
  include: Prisma.ServerErrorLogFindManyArgs,
  orderby: Prisma.ServerErrorLogOrderByWithRelationInput
) {
  return prisma.serverErrorLog.findMany({ ...include, orderBy: orderby });
}

export function findClientErrorLogs(
  include: Prisma.ClientErrorLogFindManyArgs,
  orderby: Prisma.ClientErrorLogOrderByWithRelationInput
) {
  return prisma.clientErrorLog.findMany({ ...include, orderBy: orderby });
}

export function deleteServerErrorLogById(id: string) {
  return prisma.serverErrorLog.delete({ where: { id } });
}

export function deleteClientErrorLogById(id: string) {
  return prisma.clientErrorLog.delete({ where: { id } });
}
