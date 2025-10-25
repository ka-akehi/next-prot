import { getAllPosts, PostMeta } from './getAllPosts';

export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter((post) => post.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase()));
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = posts.flatMap((post) => post.tags.map((t) => t.toLowerCase()));
  return Array.from(new Set(tags));
}
