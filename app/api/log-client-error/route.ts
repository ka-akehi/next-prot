import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  console.error('[CLIENT ERROR]', body); // 必要ならDB/Sentryに保存

  return new Response('Logged', { status: 200 });
}
