import { createRateLimitPipeline } from '@/helpers/auth/rate-limit';
import { NextResponse } from 'next/server';

type RateLimitStatusResponse = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
  threshold: number;
  consecutiveFailures: number;
  captchaRequired: boolean;
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawIdentifier = body.identifier ?? '';
    const normalizedIdentifier = rawIdentifier.trim().toLowerCase();

    if (!normalizedIdentifier) {
      return NextResponse.json({ error: 'identifier-required' }, { status: 400 });
    }

    const pipeline = await createRateLimitPipeline(normalizedIdentifier);
    const result = pipeline.enforceContext?.result;

    if (!result) {
      return NextResponse.json({ error: 'rate-limit-unavailable' }, { status: 503 });
    }

    const response: RateLimitStatusResponse = {
      allowed: result.allowed,
      retryAfterSeconds: result.retryAfterSeconds,
      remaining: result.remaining,
      threshold: result.threshold,
      consecutiveFailures: result.consecutiveFailures,
      captchaRequired: result.consecutiveFailures >= result.threshold,
    };

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[auth] failed to fetch rate limit status', error);
    return NextResponse.json({ error: 'rate-limit-status-error' }, { status: 500 });
  }
}
