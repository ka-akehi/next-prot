import { prisma } from '@infrastructure/persistence/prisma';
import type { Prisma } from '@prisma/client';

export function createPost(input: Prisma.PostCreateInput) {
  return prisma.post.create({ data: input });
}

export function deletePostById(id: string) {
  return prisma.post.delete({ where: { id } });
}

export function updatePost(id: string, args: Prisma.PostUpdateInput) {
  return prisma.post.update({ where: { id }, data: args });
}

export function findPost(postId: string, args: Prisma.PostSelect) {
  return prisma.post.findUnique({ where: { id: postId }, select: args });
}

export function findPosts(orderBy: Prisma.PostOrderByWithRelationInput, include: Prisma.PostFindManyArgs) {
  return prisma.post.findMany({ ...include, orderBy });
}

export function findPostsByInclude(
  include: Prisma.PostInclude,
  orderBy: Prisma.PostOrderByWithRelationInput,
  where?: Prisma.PostWhereInput
) {
  return prisma.post.findMany({ include, orderBy, where });
}

export function countPosts(count?: Prisma.PostCountArgs) {
  return prisma.post.count(count);
}

export function deletePostsById(id: string) {
  return prisma.post.deleteMany({ where: { id } });
}
