import { prisma } from '@infrastructure/persistence/prisma';
import { broadcastExport } from '@/server/export-ws-handler';
import type { ExportStatus } from '@prisma/client';
import { stringify } from 'csv-stringify';
import fs from 'fs';
import path from 'path';

async function* generateMockPosts(count: number) {
  for (let i = 0; i < count; i++) {
    yield {
      id: String(i + 1),
      content: 'Lorem ipsum dolor sit amet',
      createdAt: new Date(),
    };
  }
}

export async function runCsvExportInBackground(jobId: string) {
  // 1. ステータス更新 → processing
  await prisma.exportJob.update({
    where: { id: jobId },
    data: { status: 'processing' as ExportStatus, progress: 0 },
  });

  try {
    // 2. 出力対象データを準備
    const devMode = process.env.NODE_ENV === 'development';

    // 件数 (dev は 1万件でテスト、本番は DB 件数)
    const total = devMode
      ? 1_000_000 // 開発時に大きめのデータで負荷テスト可能
      : await prisma.post.count();

    // 3. CSVファイルパス生成
    const fileName = `${jobId}.csv`;
    const filePath = path.join(process.cwd(), 'public', 'exports', fileName);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // 4. CSVストリーム生成
    const writableStream = fs.createWriteStream(filePath);
    const stringifier = stringify({
      header: true,
      columns: ['id', 'content', 'createdAt'],
    });

    // pipe を先に
    stringifier.pipe(writableStream);

    let index = 0;

    if (devMode) {
      for await (const post of generateMockPosts(total)) {
        stringifier.write({
          id: post.id,
          content: post.content,
          createdAt: post.createdAt.toISOString(),
        });

        index++;
        if (index % 10_000 === 0) {
          const progress = Math.floor((index / total) * 100);
          await prisma.exportJob.update({
            where: { id: jobId },
            data: { progress },
          });
          broadcastExport(jobId, {
            type: 'export-progress',
            jobId,
            progress,
            status: 'processing',
          });
        }
      }
    } else {
      // 本番: Prisma でバッチ取得
      const batchSize = 10_000;
      let skip = 0;

      while (skip < total) {
        const posts = await prisma.post.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: batchSize,
        });

        for (const post of posts) {
          stringifier.write({
            id: String(post.id),
            content: post.content,
            createdAt: post.createdAt.toISOString(),
          });
          index++;
        }

        skip += posts.length;

        const progress = Math.floor((index / total) * 100);
        await prisma.exportJob.update({
          where: { id: jobId },
          data: { progress },
        });
        broadcastExport(jobId, {
          type: 'export-progress',
          jobId,
          progress,
          status: 'processing',
        });
      }
    }

    stringifier.end();

    await new Promise<void>((resolve, reject) => {
      writableStream.on('finish', resolve);
      writableStream.on('error', reject);
    });

    // 5. ステータス更新 → completed
    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'completed' as ExportStatus,
        progress: 100,
        filePath: `/exports/${fileName}`,
      },
    });

    // WS通知（完了）
    broadcastExport(jobId, {
      type: 'export-progress',
      jobId,
      progress: 100,
      status: 'completed',
      filePath: `/exports/${fileName}`,
    });
  } catch (error) {
    // 6. エラー時は failed に更新
    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'failed' as ExportStatus,
        error: String(error),
      },
    });

    // WS通知（失敗）
    broadcastExport(jobId, {
      type: 'export-progress',
      jobId,
      progress: 0,
      status: 'failed',
    });

    throw error;
  }
}
