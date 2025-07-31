'use server';

import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error('ログインが必要です');
  }

  const content = formData.get('content')?.toString().trim();
  if (!content) {
    throw new Error('投稿内容が空です');
  }

  await prisma.post.create({
    data: {
      content,
      userId: session.user.id,
    },
  });

  revalidatePath('/bbs');
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
