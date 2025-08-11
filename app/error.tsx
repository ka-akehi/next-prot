'use client';

import { useEffect } from 'react';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    const logError = async () => {
      try {
        await fetch('/api/log-server-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            digest: error.digest ?? null,
            pathname: window.location.pathname,
            userAgent: navigator.userAgent,
          }),
        });
      } catch (e) {
        console.error('Failed to send server error log', e);
      }
    };

    logError();
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold mb-4">サーバーエラーが発生しました</h2>
      <p className="text-gray-500 mb-6">{error.message}</p>
      <button onClick={reset} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
        リトライ
      </button>
    </div>
  );
}
