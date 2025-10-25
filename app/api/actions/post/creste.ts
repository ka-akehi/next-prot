"use server";

import { POST_ERROR_MESSAGES } from "@domain/messages/error.messages";
import { prisma } from "@infrastructure/persistence/prisma";
import { logServerError } from "@/helpers/server-log.helpers";

export async function createPost(content: string) {
  try {
    const post = await prisma.post.create({
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
