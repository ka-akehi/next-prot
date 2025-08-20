import { authConfig } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { verify2FA } from '@/lib/twofactor';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

/**
 * 2FA 検証 API
 * - 正しいコードなら lastTwoFactorAt を更新して DB に記録
 */
export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
  }

  const { code } = await req.json();
  const ok = await verify2FA(session.user.id, code);

  if (!ok) {
    return NextResponse.json({ success: false, error: '認証コードが正しくありません' }, { status: 400 });
  }

  // ✅ DB に最終検証時刻を保存
  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastTwoFactorAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
