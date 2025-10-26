import { createClientErrorLog } from '@/repositories/error-logs/error-log.repository';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, stack, pathname, userAgent } = await req.json();

    await createClientErrorLog({
      message,
      stack,
      pathname,
      userAgent,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Client error logging failed:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
