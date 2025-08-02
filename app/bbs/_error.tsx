'use client';

import { useEffect } from 'react';

type Props = {
  error: Error;
  reset: () => void;
};

export default function BbsError({ error, reset }: Props) {
  useEffect(() => {
    // ログ送信APIへ統一形式で送信
    const sendError = async () => {
      try {
        await fetch('/api/log-client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'react-boundary',
            message: error.message,
            stack: error.stack,
            timestamp: Date.now(),
          }),
        });
      } catch (e) {
        console.error('ログ送信に失敗しました', e);
      }
    };

    sendError();
  }, [error]);

  return (
    <div className="p-6 text-center text-red-600 space-y-2">
      <h2 className="text-xl font-semibold">エラーが発生しました</h2>
      <p>{error.message}</p>
      <button onClick={reset} className="mt-4 text-blue-500 underline text-sm">
        もう一度試す
      </button>
    </div>
  );
}
