'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params?.get('callbackUrl') || '/bbs';

  // 認証済みなら /bbs にリダイレクト
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/bbs');
    }
  }, [status, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">ログインしてください</h1>

      <button
        onClick={() => signIn('google', { callbackUrl })}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        data-testid="login-google"
      >
        Googleでログイン
      </button>

      <button
        onClick={() => signIn('github', { callbackUrl })}
        className="bg-gray-800 text-white px-4 py-2 rounded"
        data-testid="login-github"
      >
        GitHubでログイン
      </button>

      <p className="text-xs text-gray-500">認証後は {callbackUrl} に遷移します。</p>
    </div>
  );
}
