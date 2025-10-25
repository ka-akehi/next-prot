import { ensureRedisConnection } from '@/server/redis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.REDIS_URL) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'CONFIG_ERROR', message: 'REDIS_URL is not configured' },
      },
      { status: 500 }
    );
  }

  const startedAt = Date.now();

  try {
    const client = await ensureRedisConnection();
    const pong = await client.ping();
    const latencyMs = Date.now() - startedAt;

    return NextResponse.json(
      {
        ok: true,
        data: {
          status: pong === 'PONG' ? 'healthy' : 'unexpected-response',
          latencyMs,
          pong,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[redis] health check failed', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        ok: false,
        error: { code: 'REDIS_UNAVAILABLE', message },
      },
      { status: 503 }
    );
  }
}
