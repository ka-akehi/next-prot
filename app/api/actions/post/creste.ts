'use server';

import { logServerError } from '@/helpers/server-log.helpers';
import { createPost as createPostRecord } from '@/repositories/posts/post.repository';
import { POST_ERROR_MESSAGES } from '@domain/messages/error.messages';

export async function createPost(content: string) {
  try {
    const post = await createPostRecord({
      content,
      user: { connect: { id: 'dummy' } }, // ここでエラーを発生させる例
    });
    return post;
  } catch (error) {
    await logServerError(error, 'createPost');
    throw new Error(POST_ERROR_MESSAGES.createFailed);
  }
}
