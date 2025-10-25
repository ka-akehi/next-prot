import { prisma } from '@infrastructure/persistence/prisma';

export async function getPostList() {
  return prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });
}
