'use client';

import type { Session } from 'next-auth';
import Link from 'next/link';

export default function SecuritySection({ session }: { session: Session }) {
  return (
    <section className="border p-4 rounded bg-gray-50">
      <h2 className="text-lg font-semibold mb-2">セキュリティ</h2>

      {session.user?.twoFactorEnabled ? (
        <p className="text-green-600 text-sm">✅ 2段階認証は有効になっています</p>
      ) : (
        <Link
          href="/2fa/setup"
          className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          2段階認証を有効化する
        </Link>
      )}
    </section>
  );
}
