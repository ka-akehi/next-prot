import { PostForm, PostList } from '@/components/post';
import { authConfig } from '@infrastructure/auth/auth.config';
import { prisma } from '@infrastructure/persistence/prisma';
import { PostWithUser } from '@/types/post';
import { getServerSession } from 'next-auth';

export default async function BbsPage() {
  // ServerErrorLogで観測可能なエラー
  // throw new Error('🟥 Server error for test');

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
      {/* ClientErrorLogで観測可能なエラー */}
      {/* <TestClient /> */}

      {session?.user ? (
        <PostForm userId={session.user.id} />
      ) : (
        <p className="text-sm text-gray-500 text-center" data-testid="post-form-gate">
          ログインして投稿できます
        </p>
      )}

      <PostList posts={posts} />
    </main>
  );
}
