'use client';

import { useEffect } from 'react';

// Next.jsでも補助的に利用するクリックジャッキング対策ヘッダーを設定することができる
const PROTECTION_HEADERS = [
  {
    name: 'X-Frame-Options',
    value: 'DENY',
    description: 'ブラウザに対して、このページの内容をどのフレームや iframe にも読み込ませないよう指示する。',
  },
  {
    name: 'Content-Security-Policy',
    value: "frame-ancestors 'none';",
    description: 'CSP を利用し、旧来のヘッダーに対応していないブラウザでもフレーム埋め込みを禁止する。',
  },
];

export default function ClickjackingProtectionPage() {
  useEffect(() => {
    // ブラウザがヘッダーを無視してフレーム内で表示された場合、安全な場所にリダイレクトする。
    if (typeof window !== 'undefined' && window.top !== window.self && window.top !== null) {
      window.top.location.href = window.location.href;
    }
  }, []);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">クリックジャッキング対策デモ</h1>
        <p className="text-sm text-gray-600">
          ブラウザのヘッダー制御と JavaScript によるフォールバックで、クリックジャッキング攻撃を防ぐサンプル。
        </p>
      </header>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">HTTP レスポンスヘッダー</h2>
        <p className="mt-2 text-sm text-gray-600">
          Next.js の設定でヘッダーを追加し、ページが第三者のサイトに埋め込まれるのを防ぐ。
        </p>
        <dl className="mt-4 space-y-4">
          {PROTECTION_HEADERS.map((header) => (
            <div key={header.name} className="rounded-md border p-4">
              <dt className="text-sm font-medium">{header.name}</dt>
              <dd className="mt-1 text-sm">
                <code className="rounded bg-gray-100 px-2 py-1 text-xs">{header.value}</code>
              </dd>
              <dd className="mt-2 text-xs text-gray-500">{header.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">フレームバスター</h2>
        <p className="mt-2 text-sm text-gray-600">
          JavaScript で `top` ウィンドウとの同一性を確認し、フレーム内に表示された場合は脱出させる。
          古いブラウザやポリシーが適用されないケースの保険として利用する。
        </p>
        <pre className="mt-4 overflow-x-auto rounded bg-gray-100 p-4 text-sm">
          {`if (window.top !== window.self) {
            window.top.location.href = window.location.href;
          }`}
        </pre>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">動作確認</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-600">
          <li>このページを表示すると、PROTECTION_HEADERS のヘッダーがレスポンスに含まれているようになる。</li>
          <li>
            任意のテスト用ページからこの URL を <code>&lt;iframe&gt;</code>
            で読み込むと、ヘッダーによりブロックされるか、 JavaScript のフォールバックでトップレベルに移動させる。
          </li>
          <li>
            必要に応じて許可したいオリジンを `frame-ancestors`
            に追加することで、特定の埋め込みだけ許可することができる。
          </li>
        </ol>
      </section>
    </main>
  );
}
