import { getEnvString } from '@/shared/env';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import webPush from 'web-push';

const vapidPublicKey = getEnvString('NEXT_PUBLIC_VAPID_PUBLIC_KEY', '');
const vapidPrivateKey = getEnvString('NEXT_PUBLIC_VAPID_PRIVATE_KEY', '');
if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error('VAPID keys are not configured');
}

const vapidKeys = {
  publicKey: vapidPublicKey,
  privateKey: vapidPrivateKey,
};

webPush.setVapidDetails('mailto:you@example.com', vapidKeys.publicKey, vapidKeys.privateKey);
const SAVE_PATH = path.join(process.cwd(), 'subscriptions/sub.json');

export async function POST(req: NextRequest) {
  try {
    const subscription = await req.json();

    // ✅ JSON ファイルとして保存
    fs.mkdirSync(path.dirname(SAVE_PATH), { recursive: true });
    fs.writeFileSync(SAVE_PATH, JSON.stringify(subscription, null, 2));

    // 🔔 ここでテスト通知送信（実運用では分けて行う）
    await webPush.sendNotification(
      subscription,
      JSON.stringify({
        title: 'テスト通知',
        body: 'Next.js PWA から通知が届きました',
      })
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('❌ push error', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const subscription = await req.json();

    // ✅ 実際はDBから該当のsubscriptionを削除
    console.log('🗑️ 購読解除されたSubscription:', subscription);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('❌ unsubscribe error', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
