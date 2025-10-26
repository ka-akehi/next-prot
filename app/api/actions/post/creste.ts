"use server";

import { POST_ERROR_MESSAGES } from "@domain/messages/error.messages";
import { createPost as createPostRecord } from "@/repositories/posts/post.repository";
import { logServerError } from "@/helpers/server-log.helpers";

export async function createPost(content: string) {
  try {
    const post = await createPostRecord({
      data: {
        content,
        userId: "dummy", // ここでエラーを発生させる例
      },
    });
    return post;
  } catch (error) {
    await logServerError(error, "createPost");
    throw new Error(POST_ERROR_MESSAGES.createFailed);
  }
}
