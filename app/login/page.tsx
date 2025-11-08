'use client';

import { useLoginViewModel } from '@/view_model/auth/use-login-view-model';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const RECAPTCHA_ACTION = 'login_submit';

type LoginFormProps = {
  recaptchaSiteKey?: string;
};

function LoginForm({ recaptchaSiteKey }: LoginFormProps) {
  const params = useSearchParams();
  const callbackUrl = params?.get('callbackUrl') || '/bbs';
  const errorCode = params?.get('error') ?? null;

  const { email, setEmail, password, setPassword, formError, isSubmitting, handleCredentialsLogin, rateLimitStatus } =
    useLoginViewModel({ callbackUrl, errorCode });

  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleLoginClick = useCallback(async () => {
    let captchaToken: string | undefined;

    if (rateLimitStatus?.captchaRequired && executeRecaptcha) {
      try {
        captchaToken = await executeRecaptcha(RECAPTCHA_ACTION);
      } catch (error) {
        console.error('[login] failed to execute reCAPTCHA v3', error);
      }
    }

    await handleCredentialsLogin(captchaToken);
  }, [rateLimitStatus, executeRecaptcha, handleCredentialsLogin]);

  return (
    <div className="flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center px-4">
      <h1 className="mb-6 text-2xl font-bold">ログイン</h1>

      <div className="w-full max-w-sm space-y-4">
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

        {rateLimitStatus?.captchaRequired && !recaptchaSiteKey && (
          <p className="text-sm text-red-600">reCAPTCHA サイトキーが設定されていません。</p>
        )}

        {formError && <p className="whitespace-pre-line text-sm text-red-600">{formError}</p>}

        <button
          type="button"
          className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          disabled={isSubmitting}
          data-testid="login-credentials"
          onClick={() => {
            void handleLoginClick();
          }}
        >
          {isSubmitting ? 'ログイン中...' : 'ID/PWでログイン'}
        </button>

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

export default function LoginPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!recaptchaSiteKey) {
    return <LoginForm />;
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey} scriptProps={{ async: true, defer: true }}>
      <LoginForm recaptchaSiteKey={recaptchaSiteKey} />
    </GoogleReCaptchaProvider>
  );
}
