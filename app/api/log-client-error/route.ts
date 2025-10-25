import { prisma } from '@infrastructure/persistence/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, stack, pathname, userAgent } = await req.json();

    await prisma.clientErrorLog.create({
      data: {
        message,
        stack,
        pathname,
        userAgent,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Client error logging failed:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
