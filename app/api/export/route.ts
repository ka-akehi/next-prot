import { runCsvExportInBackground } from '@/lib/export-worker';
import { prisma } from '@/lib/prisma';
import type { ExportStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST() {
  // 1. ジョブ作成（status = pending）
  const job = await prisma.exportJob.create({
    data: { status: 'pending' as ExportStatus },
  });

  // 2. バックグラウンドで処理開始
  (async () => {
    try {
      await runCsvExportInBackground(job.id);
    } catch (error) {
      await prisma.exportJob.update({
        where: { id: job.id },
        data: { status: 'failed', error: String(error) } as {
          status: ExportStatus;
          error?: string;
        },
      });
      console.error('Export job failed:', error);
    }
  })();

  // 3. jobId を即返す
  return NextResponse.json({ jobId: job.id });
}
