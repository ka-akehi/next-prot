import { getAllTags, getPostsByTag } from '@/lib/getPostsByTag';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({ tag }));
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;

  const posts = getPostsByTag(tag);
  if (posts.length === 0) return notFound();

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">タグ: #{tag}</h1>
      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="text-xl text-blue-600 hover:underline">
              {post.title}
            </Link>
            <p className="text-gray-500 text-sm">{post.date}</p>
            <p>{post.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
