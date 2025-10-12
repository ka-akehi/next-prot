import { PASSWORD_ERROR_MESSAGES, REGISTER_ERROR_MESSAGES } from '@/lib/error.messages';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';
    const token = typeof body.token === 'string' ? body.token : '';

    if (!rawEmail) {
      return NextResponse.json({ error: PASSWORD_ERROR_MESSAGES.emailRequired }, { status: 400 });
    }

    if (!password || !confirmPassword) {
      return NextResponse.json({ error: PASSWORD_ERROR_MESSAGES.newPasswordRequired }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ error: PASSWORD_ERROR_MESSAGES.setupTokenMissing }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: PASSWORD_ERROR_MESSAGES.mismatch }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: PASSWORD_ERROR_MESSAGES.tooShort(MIN_PASSWORD_LENGTH) }, { status: 400 });
    }

    const normalizedEmail = rawEmail.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: {
          in: [normalizedEmail, rawEmail],
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: PASSWORD_ERROR_MESSAGES.setupTokenInvalid }, { status: 400 });
    }

    if (user.passwordHash) {
      return NextResponse.json({ error: REGISTER_ERROR_MESSAGES.alreadyRegistered }, { status: 409 });
    }

    if (!user.passwordSetupToken || !user.passwordSetupTokenExpires) {
      return NextResponse.json({ error: PASSWORD_ERROR_MESSAGES.setupTokenMissing }, { status: 400 });
    }

    if (user.passwordSetupTokenExpires.getTime() < Date.now()) {
      return NextResponse.json({ error: PASSWORD_ERROR_MESSAGES.setupTokenExpired }, { status: 400 });
    }

    const isValidToken = await compare(token, user.passwordSetupToken);
    if (!isValidToken) {
      return NextResponse.json({ error: PASSWORD_ERROR_MESSAGES.setupTokenInvalid }, { status: 400 });
    }

    const passwordHash = await hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        email: user.email ? user.email.toLowerCase() : normalizedEmail,
        passwordSetupToken: null,
        passwordSetupTokenExpires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[password-setup] unexpected error', error);
    return NextResponse.json({ error: PASSWORD_ERROR_MESSAGES.updateFailed }, { status: 500 });
  }
}
