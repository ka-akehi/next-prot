import { enforceIpRateLimit } from '@/server/rate-limit/ip-rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_HEADER = 'x-rate-limit-key';

export async function POST(req: NextRequest) {
  const secret = process.env.RATE_LIMIT_SECRET ?? undefined;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: { code: 'CONFIG_ERROR', message: 'Rate limiter configuration error' } },
      { status: 500 }
    );
  }

  const providedSecret = req.headers.get(INTERNAL_HEADER);
  if (providedSecret !== secret) {
    return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  let { ip } = (body ?? {}) as { ip?: string };
  if (!ip) {
    return NextResponse.json({ ok: false, error: { code: 'INVALID_PAYLOAD' } }, { status: 400 });
  }

  if (typeof ip !== 'string' || ip.trim().length === 0) {
    return NextResponse.json({ ok: false, error: { code: 'MISSING_IP' } }, { status: 400 });
  }

  const normalizedIp = ip.trim();

  try {
    const result = await enforceIpRateLimit(normalizedIp);
    const headers = new Headers({ 'content-type': 'application/json' });
    if (!result.allowed) {
      headers.set('retry-after', result.retryAfterSeconds.toString());
    }

    return new NextResponse(JSON.stringify({ ok: true, data: result }), {
      status: result.allowed ? 200 : 429,
      headers,
    });
  } catch (error) {
    console.error('[rate-limit] failed to enforce IP limit', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to enforce rate limit' } },
      { status: 500 }
    );
  }
}
