import { getAllPosts } from '@/lib/getAllPosts';
import Link from 'next/link';

export const metadata = {
  title: 'Tech Blog',
  description: '技術記事の一覧ページ',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-8">📝 Tech Blog</h1>

      <ul className="space-y-10">
        {posts.map((post) => (
          <li key={post.slug} className="border-b pb-6">
            <Link href={`/blog/${post.slug}`}>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-2/3">
                  <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                  <p className="text-gray-500 text-sm mb-2">
                    {post.date} ・ カテゴリ: {post.category}
                  </p>
                  <p className="text-gray-700">{post.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="bg-gray-100 text-sm px-2 py-1 rounded text-gray-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
