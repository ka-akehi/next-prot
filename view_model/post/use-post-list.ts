import { prisma } from '@/lib/prisma';

export async function getPostList() {
  return prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });
}
