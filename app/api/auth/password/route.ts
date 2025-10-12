import { authConfig } from '@/lib/auth.config';
import {
  AUTH_API_ERROR_MESSAGES,
  GENERAL_ERROR_MESSAGES,
  PASSWORD_ERROR_MESSAGES,
} from '@/lib/error.messages';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: GENERAL_ERROR_MESSAGES.authRequired }, { status: 401 });
  }

  try {
    const body = await request.json();
    const password = typeof body.password === 'string' ? body.password : '';
    const confirmPassword =
      typeof body.confirmPassword === 'string' ? body.confirmPassword : '';
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : undefined;

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: PASSWORD_ERROR_MESSAGES.newPasswordRequired },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: PASSWORD_ERROR_MESSAGES.mismatch },
        { status: 400 }
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: PASSWORD_ERROR_MESSAGES.tooShort(MIN_PASSWORD_LENGTH) },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (!user) {
      return NextResponse.json({ error: AUTH_API_ERROR_MESSAGES.userNotFound }, { status: 404 });
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: PASSWORD_ERROR_MESSAGES.currentRequired },
          { status: 400 }
        );
      }

      const isCurrentValid = await compare(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: PASSWORD_ERROR_MESSAGES.currentInvalid },
          { status: 400 }
        );
      }
    }

    const passwordHash = await hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        email: user.email ? user.email.toLowerCase() : user.email,
        passwordSetupToken: null,
        passwordSetupTokenExpires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[password] unexpected error', error);
    return NextResponse.json(
      { error: PASSWORD_ERROR_MESSAGES.updateFailed },
      { status: 500 }
    );
  }
}
