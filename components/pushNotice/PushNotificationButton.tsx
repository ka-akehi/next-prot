'use client';

import { usePushNotification } from '@/view_model/usePushNotification';

export default function PushNotificationButton() {
  const { subscribed, toggle } = usePushNotification();

  return (
    <button onClick={toggle} className={`px-4 py-2 rounded text-white ${subscribed ? 'bg-green-600' : 'bg-blue-600'}`}>
      {subscribed ? '通知を無効にする' : '通知を有効にする'}
    </button>
  );
}
