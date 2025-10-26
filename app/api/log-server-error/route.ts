import { createServerErrorLog } from '@/repositories/error-logs/error-log.repository';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, stack, digest, pathname, userAgent } = await req.json();

    // DBなどに保存する処理
    await createServerErrorLog({
      message,
      stack,
      digest,
      pathname,
      userAgent,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Server Error Logging Failed:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
