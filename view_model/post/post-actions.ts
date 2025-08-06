'use server';

import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logServerError } from '@/lib/server-log';

type CreatePostArgs = {
  content: string;
  userId: string;
};

export async function createPost({ content, userId }: CreatePostArgs) {
  try {
    if (!content.trim()) {
      throw new Error('投稿内容が空です');
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
    throw new Error('投稿作成中にエラーが発生しました');
  }
}

export async function deletePost(postId: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error('ログインが必要です');
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });

  if (!post || post.userId !== session.user.id) {
    throw new Error('削除権限がありません');
  }

  await prisma.post.delete({ where: { id: postId } });
}

export async function updatePost(postId: string, newContent: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error('ログインが必要です');
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });

  if (!post || post.userId !== session.user.id) {
    throw new Error('編集権限がありません');
  }

  await prisma.post.update({
    where: { id: postId },
    data: { content: newContent },
  });
}
