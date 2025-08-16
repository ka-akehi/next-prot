import { prisma } from '@/lib/prisma';
import type { ExportStatus } from '@prisma/client';
import { stringify } from 'csv-stringify';
import fs from 'fs';
import path from 'path';

export async function runCsvExportInBackground(jobId: string) {
  // 1. ステータス更新 → processing
  await prisma.exportJob.update({
    where: { id: jobId },
    data: { status: 'processing' as ExportStatus },
  });

  try {
    // 2. 大量データ取得（例: 投稿一覧）
    let posts;
    if (process.env.NODE_ENV === 'development') {
      posts = Array.from({ length: 1000000 }).map((_, i) => ({
        id: String(i + 1),
        content: 'Lorem ipsum dolor sit amet',
        createdAt: new Date(),
      }));
    } else {
      posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } });
    }

    // 3. CSVファイルパス生成
    const fileName = `${jobId}.csv`;
    const filePath = path.join(process.cwd(), 'public', 'exports', fileName);

    // exportsディレクトリがなければ作成
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // 4. CSVストリーム生成
    const writableStream = fs.createWriteStream(filePath);
    const stringifier = stringify({ header: true, columns: ['id', 'content', 'createdAt'] });

    // データをCSVに書き込み
    const total = posts.length;
    for (let index = 0; index < posts.length; index++) {
      const post = posts[index];
      stringifier.write({
        id: post.id,
        content: post.content,
        createdAt: post.createdAt.toISOString(),
      });

      // 1000件ごとに進捗を更新
      if (index % 1000 === 0) {
        await prisma.exportJob.update({
          where: { id: jobId },
          data: { progress: Math.floor((index / total) * 100) },
        });
        await new Promise((r) => setTimeout(r, 10)); // 0.1秒待機（デモ用）
      }
    }

    stringifier.end();
    stringifier.pipe(writableStream);

    // 書き込み完了を待つ
    await new Promise<void>((resolve, reject) => {
      writableStream.on('finish', resolve);
      writableStream.on('error', reject);
    });

    // 5. ステータス更新 → completed
    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'completed' as ExportStatus,
        filePath: `/exports/${fileName}`,
      },
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
    throw error; // ログ用
  }
}
