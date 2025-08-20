import { authConfig } from '@/lib/auth.config';
import { generate2FASecret } from '@/lib/twofactor';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const qrCodeUrl = await generate2FASecret(session.user.id);
  return NextResponse.json({ qrCodeUrl });
}
