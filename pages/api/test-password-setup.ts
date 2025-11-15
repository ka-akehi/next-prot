import { upsertUserByEmail } from '@/repositories/users/user.repository';
import { issuePasswordSetupToken } from '@application/auth/password-token';
import type { NextApiRequest, NextApiResponse } from 'next';

type PasswordSetupSeedBody = {
  email?: string;
  name?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = (req.body ?? {}) as PasswordSetupSeedBody;
  const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
  if (!rawEmail) {
    return res.status(400).json({ error: 'email is required' });
  }

  const normalizedEmail = rawEmail.toLowerCase();
  const fallbackName = 'Password Setup E2E';
  const displayName = typeof body.name === 'string' && body.name.trim() ? body.name : fallbackName;

  const user = await upsertUserByEmail(
    normalizedEmail,
    {
      email: normalizedEmail,
      name: displayName,
      passwordHash: null,
    },
    {
      email: normalizedEmail,
      name: displayName,
      passwordHash: null,
    }
  );

  const { token, expiresAt } = await issuePasswordSetupToken(user.id);

  return res.status(200).json({ email: normalizedEmail, token, expiresAt });
}
