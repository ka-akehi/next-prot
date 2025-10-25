import { getAllPosts, PostMeta } from './getAllPosts';

export function getPostsByCategory(category: string): PostMeta[] {
  return getAllPosts().filter((post) => post.category.toLowerCase() === category.toLowerCase());
}

export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const set = new Set(posts.map((post) => post.category.toLowerCase()));
  return Array.from(set);
}
