import { buildRangeResponse } from '@/server/testing/pwned-password-store';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const prefix = typeof req.query.prefix === 'string' ? req.query.prefix : '';
  const body = buildRangeResponse(prefix);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.status(200).send(body);
}
