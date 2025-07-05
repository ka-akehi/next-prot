import { POSTS_DIR } from '@/lib/getAllPosts';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';

export type Post = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  category: string;
  description: string;
  contentHtml: string;
};

export async function getPost(slug: string): Promise<Post | null> {
  const fullPath = path.join(POSTS_DIR, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    title: data.title,
    date: data.date,
    tags: data.tags,
    category: data.category,
    description: data.description,
    contentHtml,
  };
}
