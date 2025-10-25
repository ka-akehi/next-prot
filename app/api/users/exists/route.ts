import { AUTH_ERROR_MESSAGES, AUTH_PROCESS_ERROR_MESSAGES } from '@/domain/auth/auth.errors';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const body = await req.json();
  const email = body.email ? body.email.trim() : '';

  if (!email) {
    return NextResponse.json({ error: AUTH_ERROR_MESSAGES.CredentialsSignin }, { status: 400 });
  }

  const userExists = await checkIfUserExists(email);
  if (userExists) {
    return NextResponse.json({ result: true }, { status: 200 });
  } else {
    return NextResponse.json({ error: AUTH_PROCESS_ERROR_MESSAGES.login }, { status: 404 });
  }
}
