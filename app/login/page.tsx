'use client';

import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">ログインしてください</h1>

      <button onClick={() => signIn('google')} className="bg-blue-600 text-white px-4 py-2 rounded">
        Googleでログイン
      </button>

      <button onClick={() => signIn('github')} className="bg-gray-800 text-white px-4 py-2 rounded">
        GitHubでログイン
      </button>
    </div>
  );
}
