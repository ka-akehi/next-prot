import { findExportJobById } from '@/repositories/export-jobs/export-job.repository';
import { EXPORT_ERROR_MESSAGES } from '@domain/messages/error.messages';
import { NextResponse } from 'next/server';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: Params) {
  const { id } = await context.params;

  const job = await findExportJobById(id, {
    id: true,
    status: true,
    filePath: true,
    error: true,
    progress: true,
    createdAt: true,
    updatedAt: true,
  });

  if (!job) {
    return NextResponse.json({ error: EXPORT_ERROR_MESSAGES.jobNotFound }, { status: 404 });
  }

  return NextResponse.json(job, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
