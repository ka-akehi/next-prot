'use server';

import { prisma } from '@/lib/prisma';
import { logServerError } from '@/lib/server-log';

export async function createPost(content: string) {
  try {
    const post = await prisma.post.create({
      data: {
        content,
        userId: 'dummy', // ここでエラーを発生させる例
      },
    });
    return post;
  } catch (error) {
    await logServerError(error, 'createPost');
    throw new Error('投稿作成中にエラーが発生しました');
  }
}
