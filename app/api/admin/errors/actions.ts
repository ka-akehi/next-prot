'use server';

import { deleteClientErrorLogById, deleteServerErrorLogById } from '@/repositories/error-logs/error-log.repository';
import { revalidatePath } from 'next/cache';

export async function deleteErrorLog(type: 'server' | 'client', id: string) {
  if (type === 'server') {
    await deleteServerErrorLogById(id);
  } else {
    await deleteClientErrorLogById(id);
  }

  revalidatePath('/admin/errors');
}
