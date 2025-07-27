'use client';

import { useEffect, useState } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

export function usePushNotification() {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        })
      );
    }
  }, []);

  const subscribe = async () => {
    if (!('serviceWorker' in navigator)) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await fetch('/api/pushNotice', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });

    setSubscribed(true);
  };

  const unsubscribe = async () => {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // ✅ 任意: サーバー側に購読解除を通知
      await fetch('/api/pushNotice', {
        method: 'DELETE',
        body: JSON.stringify(subscription),
      });

      setSubscribed(false);
    }
  };

  const toggle = () => {
    if (subscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  return {
    subscribed,
    toggle,
  };
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Clean = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Clean);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}
