import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // 本番では提供しない（開発専用）
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!message) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: 'BAD_REQUEST', message: 'message is required' },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: { echo: message },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Echo API error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'INTERNAL_ERROR', message: 'unexpected error' },
      },
      { status: 500 }
    );
  }
}
