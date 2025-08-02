'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteErrorLog(type: 'server' | 'client', id: string) {
  if (type === 'server') {
    await prisma.serverErrorLog.delete({ where: { id } });
  } else {
    await prisma.clientErrorLog.delete({ where: { id } });
  }

  revalidatePath('/admin/errors');
}
