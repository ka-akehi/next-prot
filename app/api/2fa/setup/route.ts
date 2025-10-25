import { authConfig } from '@infrastructure/auth/auth.config';
import { GENERAL_ERROR_MESSAGES } from '@domain/messages/error.messages';
import { generate2FASecret } from '@infrastructure/auth/twofactor';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: GENERAL_ERROR_MESSAGES.authRequired }, { status: 401 });
  }

  const qrCodeUrl = await generate2FASecret(session.user.id);
  return NextResponse.json({ qrCodeUrl });
}
