import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { content } = (req.body ?? {}) as { content?: string };
  const body = content?.toString().trim() || `Other user's post ${Date.now()}`;

  // テスト用の「別ユーザー」
  const other = await prisma.user.upsert({
    where: { email: 'otheruser@example.com' },
    update: {},
    create: {
      email: 'otheruser@example.com',
      name: 'Other User',
      image: null,
    },
  });

  // 既存の同一本文を避けるため、軽くユニーク化
  const uniqueContent = `${body} ::seed::${Date.now()}`;

  const post = await prisma.post.create({
    data: {
      content: uniqueContent,
      userId: other.id,
    },
  });

  return res.status(200).json({
    id: post.id,
    content: post.content,
    authorId: post.userId,
  });
}
