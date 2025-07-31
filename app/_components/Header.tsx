'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="p-4 flex justify-between items-center border-b">
      <h1 className="text-xl font-bold">📝 BBS App</h1>
      <div>
        {session ? (
          <div className="flex items-center gap-2">
            <span>{session.user?.name}</span>
            <button onClick={() => signOut()} className="text-red-500">
              ログアウト
            </button>
          </div>
        ) : (
          <button onClick={() => signIn()} className="text-blue-500">
            ログイン
          </button>
        )}
      </div>
    </header>
  );
}
