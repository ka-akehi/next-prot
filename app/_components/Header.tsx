'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const { data: session, status } = useSession();
  const isAuth = status === 'authenticated';

  return (
    <header className="p-4 flex justify-between items-center border-b bg-white sticky top-0 z-10">
      <Link href="/bbs" className="text-xl font-bold" data-testid="nav-home">
        📝 BBS App
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/bbs" className="text-sm hover:underline">
          Home
        </Link>
        {isAuth && (
          <Link href="/mypage" className="text-sm hover:underline" data-testid="nav-profile">
            My Posts
          </Link>
        )}
        {isAuth ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/bbs' })}
              className="text-red-500 text-sm"
              data-testid="nav-logout"
            >
              ログアウト
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn(undefined, { callbackUrl: '/bbs' })}
            className="text-blue-500 text-sm"
            data-testid="nav-login"
          >
            ログイン
          </button>
        )}
      </nav>
    </header>
  );
}
