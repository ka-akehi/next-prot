'use client';

import { GENERAL_ERROR_MESSAGES, TWO_FACTOR_ERROR_MESSAGES } from '@domain/messages/error.messages';
import { useState } from 'react';

export default function TwoFAVerifyPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (data.success) {
        // セッションをリロードさせて新しいJWTを取得
        await fetch('/api/auth/session?update', { cache: 'no-store' });

        // そのままリダイレクト
        window.location.href = '/bbs';
      } else {
        setError(data.error ?? TWO_FACTOR_ERROR_MESSAGES.invalidCode);
      }
    } catch {
      setError(GENERAL_ERROR_MESSAGES.server);
    } finally {
      setLoading(false);
      setCode('');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-center text-2xl font-bold text-gray-800">2段階認証の確認</h1>
        <p className="mb-6 text-center text-gray-600">認証アプリに表示されている6桁のコードを入力してください。</p>
        <form onSubmit={verify}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="mb-4 w-full rounded border px-3 py-2 text-center text-lg tracking-widest focus:border-blue-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '確認中...' : 'コードを確認'}
          </button>
        </form>

        {error && <p className="mt-4 text-center font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
}
