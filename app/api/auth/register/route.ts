import { PASSWORD_ERROR_MESSAGES, REGISTER_ERROR_MESSAGES } from '@/lib/error.messages';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = new RegExp(
  [
    "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+",
    '@',
    '[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?',
    '(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
  ].join('')
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailInput = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;

    if (!emailInput || !password) {
      return NextResponse.json(
        { error: REGISTER_ERROR_MESSAGES.credentialsRequired },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(emailInput)) {
      return NextResponse.json(
        { error: REGISTER_ERROR_MESSAGES.invalidEmail },
        { status: 400 }
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: PASSWORD_ERROR_MESSAGES.tooShort(MIN_PASSWORD_LENGTH) },
        { status: 400 }
      );
    }

    const normalizedEmail = emailInput.toLowerCase();

    const [existingUser] = await prisma.$queryRaw<
      Array<{
        id: string;
        email: string | null;
        passwordHash: string | null;
      }>
    >(Prisma.sql`
      SELECT "id", "email", "passwordHash"
      FROM "User"
      WHERE LOWER("email") = LOWER(${emailInput})
      ORDER BY CASE WHEN "passwordHash" IS NULL THEN 1 ELSE 0 END,
               "createdAt" DESC
      LIMIT 1
    `);

    if (existingUser?.email && existingUser.email !== normalizedEmail) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { email: normalizedEmail },
      });
    }

    if (existingUser?.passwordHash) {
      return NextResponse.json(
        { error: REGISTER_ERROR_MESSAGES.alreadyRegistered },
        { status: 409 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        {
          error: REGISTER_ERROR_MESSAGES.requirePasswordSetup,
          redirectTo: '/account/password/new',
        },
        { status: 409 }
      );
    } else {
      const passwordHash = await hash(password, 10);
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name ?? null,
          passwordHash,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[register] unexpected error', error);
    return NextResponse.json(
      { error: REGISTER_ERROR_MESSAGES.unexpected },
      { status: 500 }
    );
  }
}
