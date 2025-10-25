import {
  PASSWORD_ERROR_MESSAGES,
  REGISTER_ERROR_MESSAGES,
} from "@domain/messages/error.messages";
import {
  MIN_PASSWORD_LENGTH,
  isPasswordComplex,
} from "@/helpers/password-policy.helpers";
import { prisma } from "@infrastructure/persistence/prisma";
import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawEmail = !!body.email ? body.email.trim() : "";
    const password = !!body.password ? body.password : "";
    const confirmPassword = !!body.confirmPassword ? body.confirmPassword : "";
    const token = !!body.token ? body.token : "";

    if (!rawEmail) {
      return NextResponse.json(
        { error: PASSWORD_ERROR_MESSAGES.emailRequired },
        { status: 400 }
      );
    }

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: PASSWORD_ERROR_MESSAGES.newPasswordRequired },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: PASSWORD_ERROR_MESSAGES.setupTokenMissing },
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

    if (!isPasswordComplex(password)) {
      return NextResponse.json(
        { error: PASSWORD_ERROR_MESSAGES.complexity },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: PASSWORD_ERROR_MESSAGES.setupTokenInvalid },
        { status: 400 }
      );
    }

    if (user.passwordHash) {
      return NextResponse.json(
        { error: REGISTER_ERROR_MESSAGES.alreadyRegistered },
        { status: 409 }
      );
    }

    if (!user.passwordSetupToken || !user.passwordSetupTokenExpires) {
      return NextResponse.json(
        { error: PASSWORD_ERROR_MESSAGES.setupTokenMissing },
        { status: 400 }
      );
    }

    if (user.passwordSetupTokenExpires.getTime() < Date.now()) {
      return NextResponse.json(
        { error: PASSWORD_ERROR_MESSAGES.setupTokenExpired },
        { status: 400 }
      );
    }

    const isValidToken = await compare(token, user.passwordSetupToken);
    if (!isValidToken) {
      return NextResponse.json(
        { error: PASSWORD_ERROR_MESSAGES.setupTokenInvalid },
        { status: 400 }
      );
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
    console.error("[password-setup] unexpected error", error);
    return NextResponse.json(
      { error: PASSWORD_ERROR_MESSAGES.updateFailed },
      { status: 500 }
    );
  }
}
