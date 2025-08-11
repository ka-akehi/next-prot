import PushNotificationButton from '@/components/pushNotice/PushNotificationButton';

export default function HomePage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Next.js PWA 通知テスト</h1>
      <PushNotificationButton />
    </main>
  );
}
