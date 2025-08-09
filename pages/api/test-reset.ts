import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // テストユーザーのメールは /api/test-login と合わせる
  const email = 'testuser@example.com';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(200).json({ cleared: 0 });

  // ユーザーの投稿を削除（テーブル名は実スキーマに合わせて）
  const result = await prisma.post.deleteMany({
    where: { userId: user.id },
  });

  return res.status(200).json({ cleared: result.count });
}
