import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

export const POSTS_DIR = path.join(process.cwd(), 'content/blog');

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  description: string;
};

export function getAllPosts(): PostMeta[] {
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      const fileContent = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
      const { data } = matter(fileContent);

      return {
        slug,
        title: data.title,
        date: data.date,
        category: data.category,
        tags: data.tags,
        description: data.description,
      } as PostMeta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return files;
}
