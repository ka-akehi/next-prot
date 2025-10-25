import { getAllPosts } from '@infrastructure/content/getAllPosts';
import { getPost } from '@infrastructure/content/getPost';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const res = getAllPosts();

  return res.map((obj) => ({
    slug: obj.slug,
  }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return notFound();

  return (
    <article className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <p className="text-sm text-gray-500">{post.date}</p>

      <div className="markdown" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </article>
  );
}
