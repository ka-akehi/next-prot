import { authConfig } from '@infrastructure/auth/auth.config';
import { AUTH_API_ERROR_MESSAGES } from '@domain/messages/error.messages';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  // 開発専用
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', { status: 404 });
  }

  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'UNAUTHORIZED', message: AUTH_API_ERROR_MESSAGES.loginRequired },
      },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: { userId: session.user.id },
    },
    { status: 200 }
  );
}
