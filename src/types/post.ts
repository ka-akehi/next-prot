import { Post } from '@prisma/client';

export type PostWithUser = Post & {
  user: {
    name: string | null;
  };
};
