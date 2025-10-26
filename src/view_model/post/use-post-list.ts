import { findPostsByInclude } from '@/repositories/posts/post.repository';

export async function getPostList() {
  return findPostsByInclude({ user: true }, { createdAt: 'desc' });
}
