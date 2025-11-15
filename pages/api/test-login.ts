import { upsertUserByEmail } from '@/repositories/users/user.repository';
import { getEnvString } from '@/shared/env';
import { NextApiRequest, NextApiResponse } from 'next';
import { encode } from 'next-auth/jwt';
import { setCookie } from 'nookies';

const TEST_USER_EMAIL = 'testuser@example.com';
const COOKIE_NAME = 'next-auth.session-token';
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const nodeEnv = getEnvString('NODE_ENV', '');
  if (nodeEnv === 'production') {
    return res.status(403).json({ error: 'forbidden' });
  }

  const nextAuthSecret = getEnvString('NEXTAUTH_SECRET', '');
  if (!nextAuthSecret) {
    return res.status(500).json({ error: 'NEXTAUTH_SECRET is not configured' });
  }

  const testUser = await upsertUserByEmail(
    TEST_USER_EMAIL,
    {},
    {
      name: 'Test User',
      email: TEST_USER_EMAIL,
      image: 'https://example.com/avatar.png',
    }
  );

  const exp = Math.floor(Date.now() / 1000) + THIRTY_DAYS_IN_SECONDS;
  const token = await encode({
    token: {
      id: testUser.id,
      name: testUser.name ?? 'Test User',
      email: testUser.email ?? TEST_USER_EMAIL,
      picture: testUser.image ?? undefined,
      twoFactorEnabled: Boolean(testUser.twoFactorEnabled),
      twoFactorVerified: !testUser.twoFactorEnabled,
      twoFactorVerifiedAt: testUser.twoFactorEnabled ? undefined : Date.now(),
      exp,
    },
    secret: nextAuthSecret,
  });

  setCookie({ res }, COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: THIRTY_DAYS_IN_SECONDS,
  });

  return res.status(200).json({ message: 'Test login successful' });
}
