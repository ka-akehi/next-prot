import ExportSection from '@/components/mypage/ExportSection';
import SecuritySection from '@/components/mypage/SecuritySection';
import { PostList } from '@/components/post';
import { authConfig } from '@infrastructure/auth/auth.config';
import { prisma } from '@infrastructure/persistence/prisma';
import { getServerSession } from 'next-auth';

export default async function MyPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return (
      <div className="p-6 text-center text-sm text-gray-500" data-testid="mypage-guest">
        このページを見るにはログインしてください。
      </div>
    );
  }

  const posts = await prisma.post.findMany({
    where: { userId: session.user.id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="max-w-xl mx-auto space-y-6 p-4">
      <h1 className="text-2xl font-bold">マイページ</h1>

      <SecuritySection session={session} />
      <ExportSection />

      {posts.length > 0 ? <PostList posts={posts} /> : <p className="text-gray-500 text-sm">投稿がありません。</p>}
    </main>
  );
}
