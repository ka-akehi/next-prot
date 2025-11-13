import { getEnvString } from '@/shared/env';
import { extractClientIpFromHeaders } from '@shared/network/extract-client-ip';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const RATE_LIMIT_HEADER_KEY = 'x-rate-limit-key';
const RATE_LIMIT_ERROR_CODE = 'TooManyRequests';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const nextAuthSecret = getEnvString('NEXTAUTH_SECRET', '');

  if (shouldRateLimitAuth(pathname, req.method)) {
    const rateLimitResponse = await handleRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  const token = await getToken({ req, secret: nextAuthSecret });

  // ✅ /mypage, /2fa はログイン必須
  if (pathname.startsWith('/mypage') || pathname.startsWith('/2fa')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (token.twoFactorEnabled && !token.twoFactorVerified && !pathname.startsWith('/2fa/verify')) {
      return NextResponse.redirect(new URL('/2fa/verify', req.url));
    }
  }

  // ✅ /bbs は未ログインでもOK。ただしログイン済かつ 2FA未完了ならブロック
  if (pathname.startsWith('/bbs')) {
    if (token?.twoFactorEnabled && !token?.twoFactorVerified) {
      return NextResponse.redirect(new URL('/2fa/verify', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/:path*', '/mypage/:path*', '/2fa/:path*', '/bbs/:path*'],
};

function shouldRateLimitAuth(pathname: string, method: string): boolean {
  if (method !== 'POST') {
    return false;
  }
  return pathname.startsWith('/api/auth/callback/credentials');
}

async function handleRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const rateLimitSecret = getEnvString('RATE_LIMIT_SECRET', '');
  if (!rateLimitSecret) {
    return null;
  }

  const ip = extractClientIpFromHeaders(req.headers);
  const body = JSON.stringify({ ip, path: req.nextUrl.pathname });
  const url = new URL('/api/internal/ip-rate-limit', req.url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [RATE_LIMIT_HEADER_KEY]: rateLimitSecret,
      },
      body,
    });

    if (response.status !== 429) {
      return null;
    }

    const data = await response.json().catch(() => null);
    const retryAfter = response.headers.get('retry-after') ?? data?.data?.retryAfterSeconds?.toString();
    const remaining = data?.data?.remaining;

    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('error', RATE_LIMIT_ERROR_CODE);

    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (retryAfter) {
      headers['retry-after'] = retryAfter;
    }
    if (typeof remaining === 'number') {
      headers['x-rate-limit-remaining'] = String(Math.max(remaining, 0));
    }

    return new NextResponse(JSON.stringify({ url: redirectUrl.toString() }), {
      status: 429,
      headers,
    });
  } catch (error) {
    console.error('[middleware] failed to call rate limit endpoint', error);
    return null;
  }
}
