import { prisma } from '@infrastructure/persistence/prisma';
import { runCsvExportInBackground } from '@/server/export-worker';
import type { ExportStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST() {
  // 1. ジョブ作成（status = pending）
  const job = await prisma.exportJob.create({
    data: { status: 'pending' as ExportStatus, progress: 0 },
  });

  // 2. レスポンスを返した後にバックグラウンドで処理開始
  setImmediate(async () => {
    try {
      await runCsvExportInBackground(job.id);
    } catch (error) {
      // Prisma で失敗状態を保存
      await prisma.exportJob.update({
        where: { id: job.id },
        data: {
          status: 'failed' as ExportStatus,
          error: String(error),
        },
      });
      console.error('Export job failed:', error);
    }
  });

  // 3. jobId を即返す（レスポンスは待たない）
  return NextResponse.json({ jobId: job.id });
}
