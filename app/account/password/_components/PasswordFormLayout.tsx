'use client';

import Link from 'next/link';
import { FormEventHandler } from 'react';

type PasswordFormLayoutProps = {
  title: string;
  onSubmitAction: FormEventHandler<HTMLFormElement>;
  isSubmitting: boolean;
  password: string;
  onPasswordChangeAction: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChangeAction: (value: string) => void;
  error: string | null;
  success: string | null;
  requireCurrentPassword?: boolean;
  currentPassword?: string;
  onCurrentPasswordChangeAction?: (value: string) => void;
};

export function PasswordFormLayout({
  title,
  onSubmitAction,
  isSubmitting,
  password,
  onPasswordChangeAction,
  confirmPassword,
  onConfirmPasswordChangeAction,
  error,
  success,
  requireCurrentPassword = false,
  currentPassword = '',
  onCurrentPasswordChangeAction,
}: PasswordFormLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>

        <form onSubmit={onSubmitAction} className="space-y-4" noValidate>
          {requireCurrentPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="current-password">
                現在のパスワード
              </label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => onCurrentPasswordChangeAction?.(event.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="new-password">
              新しいパスワード
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => onPasswordChangeAction(event.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="confirm-password">
              新しいパスワード (確認)
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => onConfirmPasswordChangeAction(event.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? '更新中...' : 'パスワードを更新する'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600">
          ログイン画面に戻る場合は
          <Link href="/login" className="text-blue-600 underline">
            こちら
          </Link>
        </p>
      </div>
    </div>
  );
}
