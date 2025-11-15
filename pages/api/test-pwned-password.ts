import {
  clearPwnedPasswordOverrides,
  setPwnedPasswordOverrides,
  type PwnedPasswordOverrideInput,
} from '@/server/testing/pwned-password-store';
import type { NextApiRequest, NextApiResponse } from 'next';

type ConfigurePwnedMockBody = {
  overrides?: PwnedPasswordOverrideInput;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const body = (req.body ?? {}) as ConfigurePwnedMockBody;
    const overrides = body.overrides ?? {};
    const prefixCount = setPwnedPasswordOverrides(overrides);
    return res.status(200).json({ prefixes: prefixCount });
  }

  if (req.method === 'DELETE') {
    clearPwnedPasswordOverrides();
    return res.status(204).end();
  }

  res.setHeader('Allow', 'POST,DELETE');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
