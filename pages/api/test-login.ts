import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import { setCookie } from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ✅ テストユーザー作成または取得
  const testUser = await prisma.user.upsert({
    where: { email: 'testuser@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'testuser@example.com',
      image: 'https://example.com/avatar.png',
    },
  });

  // ✅ セッション生成
  const sessionToken = `test-session-${Date.now()}`;
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30日間

  await prisma.session.create({
    data: {
      sessionToken,
      userId: testUser.id,
      expires,
    },
  });

  // ✅ セッションクッキーを発行（next-auth.session-token）
  setCookie({ res }, 'next-auth.session-token', sessionToken, {
    path: '/',
    httpOnly: true,
    secure: (process.env.NODE_ENV as string) === 'production',
    sameSite: 'lax',
  });

  return res.status(200).json({ message: 'Test login successful' });
}
