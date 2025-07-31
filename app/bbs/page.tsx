import { PostForm, PostList } from '@/components/post';
import { prisma } from '@/lib/prisma';

export default async function BbsPage() {
  const posts = await prisma.post.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="max-w-xl mx-auto space-y-6 p-4">
      <h1 className="text-2xl font-bold">掲示板</h1>
      <PostForm />
      <PostList posts={posts} />
    </main>
  );
}
