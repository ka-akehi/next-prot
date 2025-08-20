import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // ✅ /mypage, /2fa はログイン必須
  if (pathname.startsWith('/mypage') || pathname.startsWith('/2fa')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (token.twoFactorEnabled && !token.twoFactorVerified && !pathname.startsWith('/2fa/verify')) {
      return NextResponse.redirect(new URL('/2fa/verify', req.url));
    }
    return NextResponse.next();
  }

  // ✅ /bbs は未ログインでもOK。ただしログイン済かつ 2FA未完了ならブロック
  if (pathname.startsWith('/bbs')) {
    if (token?.twoFactorEnabled && !token?.twoFactorVerified) {
      return NextResponse.redirect(new URL('/2fa/verify', req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/mypage/:path*', '/2fa/:path*', '/bbs/:path*'],
};
