'use server';

import { getAuthSession } from '@/lib/auth';
import { GENERAL_ERROR_MESSAGES, POST_ERROR_MESSAGES } from '@/lib/error.messages';
import { prisma } from '@/lib/prisma';
import { logServerError } from '@/lib/server-log';

type CreatePostArgs = {
  content: string;
  userId: string;
};

export async function createPost({ content, userId }: CreatePostArgs) {
  try {
    if (!content.trim()) {
      throw new Error(POST_ERROR_MESSAGES.emptyContent);
    }

    const post = await prisma.post.create({
      data: {
        content,
        userId, // ← ✅ ここで使われる
      },
    });
    return post;
  } catch (error) {
    await logServerError(error, 'createPost');
    throw new Error(POST_ERROR_MESSAGES.createFailed);
  }
}

export async function deletePost(postId: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error(GENERAL_ERROR_MESSAGES.authRequired);
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });

  if (!post || post.userId !== session.user.id) {
    throw new Error(POST_ERROR_MESSAGES.deleteUnauthorized);
  }

  await prisma.post.delete({ where: { id: postId } });
}

export async function updatePost(postId: string, newContent: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error(GENERAL_ERROR_MESSAGES.authRequired);
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });

  if (!post || post.userId !== session.user.id) {
    throw new Error(POST_ERROR_MESSAGES.updateUnauthorized);
  }

  await prisma.post.update({
    where: { id: postId },
    data: { content: newContent },
  });
}
