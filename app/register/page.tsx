'use client';

import { useRegisterViewModel } from '@/view_model/auth/use-register-view-model';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function RegisterPage() {
  const params = useSearchParams();
  const callbackUrl = params?.get('callbackUrl') || '/bbs';

  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    success,
    isSubmitting,
    handleSubmit,
    requiresPasswordSetup,
  } = useRegisterViewModel({ callbackUrl });

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4">
      <h1 className="mb-6 text-2xl font-bold">新規登録</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="name">
            名前 (任意)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="email">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="password">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {requiresPasswordSetup && (
          <p className="text-sm text-blue-600">
            パスワードをお忘れの方は
            <Link href="/account/password/new" className="underline">
              パスワード設定ページ
            </Link>
            から設定してください。
          </p>
        )}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <button
          type="submit"
          className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? '登録処理中...' : '登録する'}
        </button>
      </form>

      <p className="mt-4 text-xs text-gray-600">
        アカウントをお持ちの方は
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-blue-600 underline">
          ログインページ
        </Link>
        へ
      </p>
    </div>
  );
}
