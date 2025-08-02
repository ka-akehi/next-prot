import { PostForm } from '@/components/post/post-form';
import { PostList } from '@/components/post/post-list';
import { authConfig } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { PostWithUser } from '@/types/post';
import { getServerSession } from 'next-auth';

export default async function BbsPage() {
  const session = await getServerSession(authConfig);

  const posts: PostWithUser[] = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">掲示板</h1>

      {session?.user ? (
        <PostForm userId={session.user.id} />
      ) : (
        <p className="text-sm text-gray-500 text-center">ログインして投稿できます</p>
      )}

      <PostList posts={posts} />
    </main>
  );
}
