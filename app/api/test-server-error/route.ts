import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // 開発専用
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // 明示的に 500 を発生させる
    if (body?.cause === 'throw') {
      throw new Error('Intentional server error for testing');
    }

    return NextResponse.json(
      {
        ok: true,
        data: { status: 'ok' },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Server Error API:', error);
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'INTERNAL_ERROR', message: 'unexpected error' },
      },
      { status: 500 }
    );
  }
}
