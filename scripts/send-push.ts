import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import webPush from 'web-push';
dotenv.config();

// ✅ 保存された subscription を読み込む
const subscriptionPath = path.join(process.cwd(), 'subscriptions/sub.json');
const subscription = JSON.parse(fs.readFileSync(subscriptionPath, 'utf-8'));

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY!,
};

webPush.setVapidDetails('mailto:you@example.com', vapidKeys.publicKey, vapidKeys.privateKey);

webPush
  .sendNotification(
    subscription,
    JSON.stringify({
      title: '手動通知',
      body: 'CLIから通知を送信しました',
    })
  )
  .then(() => {
    console.log('✅ 通知送信成功');
  })
  .catch(console.error);
