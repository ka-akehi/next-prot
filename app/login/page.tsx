'use client';

import { useLoginViewModel } from '@/view_model/auth/use-login-view-model';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const params = useSearchParams();
  const callbackUrl = params?.get('callbackUrl') || '/bbs';
  const errorCode = params?.get('error') ?? null;

  const { email, setEmail, password, setPassword, formError, isSubmitting, handleCredentialsLogin } = useLoginViewModel(
    { callbackUrl, errorCode }
  );

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4">
      <h1 className="mb-6 text-2xl font-bold">ログイン</h1>

      <div className="w-full max-w-sm space-y-4">
        <form onSubmit={handleCredentialsLogin} className="space-y-3" noValidate>
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
            disabled={isSubmitting}
            data-testid="login-credentials"
          >
            {isSubmitting ? 'ログイン中...' : 'ID/PWでログイン'}
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex-1 border-b" />
          <span>または</span>
          <span className="flex-1 border-b" />
        </div>

        <button
          onClick={() => signIn('google', { callbackUrl })}
          className="w-full rounded bg-red-600 px-4 py-2 text-white"
          data-testid="login-google"
        >
          Googleでログイン
        </button>

        <button
          onClick={() => signIn('github', { callbackUrl })}
          className="w-full rounded bg-gray-800 px-4 py-2 text-white"
          data-testid="login-github"
        >
          GitHubでログイン
        </button>

        <p className="text-center text-xs text-gray-600">
          アカウントをお持ちでない場合は
          <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-blue-600 underline">
            新規登録
          </Link>
          へ
        </p>
      </div>
    </div>
  );
}
