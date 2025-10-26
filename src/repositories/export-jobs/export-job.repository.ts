import { prisma } from '@infrastructure/persistence/prisma';
import type { Prisma } from '@prisma/client';

export function createExportJob(input: Prisma.ExportJobCreateInput) {
  return prisma.exportJob.create({ data: input });
}

export function updateExportJobById(id: string, input: Prisma.ExportJobUpdateInput) {
  return prisma.exportJob.update({ where: { id }, data: input });
}

export function findExportJobById(id: string, select?: Prisma.ExportJobSelect) {
  return prisma.exportJob.findUnique({ where: { id }, select });
}
