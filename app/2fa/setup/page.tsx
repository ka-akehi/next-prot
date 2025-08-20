'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function TwoFASetupPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setup2FA = async () => {
    setLoading(true);
    const res = await fetch('/api/2fa/setup', { method: 'POST' });
    const data = await res.json();
    setQrCode(data.qrCodeUrl);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-center text-2xl font-bold text-gray-800">2段階認証のセットアップ</h1>
        <p className="mb-6 text-center text-gray-600">
          下のボタンをクリックしてQRコードを生成してください。
          <br />
          生成されたQRコードをGoogle AuthenticatorまたはAuthyでスキャンしてください。
        </p>
        <div className="flex justify-center">
          <button
            onClick={setup2FA}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '生成中...' : 'QRコードを生成'}
          </button>
        </div>

        {qrCode && (
          <div className="mt-6 text-center space-y-4">
            <p className="mb-2 text-gray-700">以下のQRコードをスキャンしてください:</p>
            <Image src={qrCode} alt="2FA QRコード" className="mx-auto rounded border p-2" width={200} height={200} />
            {/* 次へボタン → /2fa/verify */}
            <div>
              <Link
                href="/2fa/verify"
                className="inline-block mt-4 rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
              >
                次へ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
