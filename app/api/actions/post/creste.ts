'use server';

import { POST_ERROR_MESSAGES } from '@/lib/error.messages';
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
    throw new Error(POST_ERROR_MESSAGES.createFailed);
  }
}
