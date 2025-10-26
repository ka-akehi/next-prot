'use server';

import { logServerError } from '@/helpers/server-log.helpers';
import * as postRepository from '@/repositories/posts/post.repository';
import { GENERAL_ERROR_MESSAGES, POST_ERROR_MESSAGES } from '@domain/messages/error.messages';
import { getAuthSession } from '@infrastructure/auth/auth';

type CreatePostArgs = {
  content: string;
  userId: string;
};

export async function createPost({ content, userId }: CreatePostArgs) {
  try {
    if (!content.trim()) {
      throw new Error(POST_ERROR_MESSAGES.emptyContent);
    }

    const post = await postRepository.createPost({
      content,
      user: { connect: { id: userId } }, // ← ✅ ここで使われる
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

  const post = await postRepository.findPost(postId, { userId: true });

  if (!post || post.userId !== session.user.id) {
    throw new Error(POST_ERROR_MESSAGES.deleteUnauthorized);
  }

  await postRepository.deletePostById(postId);
}

export async function updatePost(postId: string, newContent: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error(GENERAL_ERROR_MESSAGES.authRequired);
  }

  const post = await postRepository.findPost(postId, { userId: true });

  if (!post || post.userId !== session.user.id) {
    throw new Error(POST_ERROR_MESSAGES.updateUnauthorized);
  }

  await postRepository.updatePost(postId, { content: newContent });
}
