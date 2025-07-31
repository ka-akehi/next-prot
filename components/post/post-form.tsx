'use client';

import { usePostCreate } from '@/view_model/post/use-post-create';
import { useSession } from 'next-auth/react';

export function PostForm() {
  const { data: session, status } = useSession();
  const { content, setContent, error, submit } = usePostCreate();

  if (status === 'loading') return null;

  if (!session) {
    return <div className="text-sm text-gray-500 border p-3 rounded">投稿にはログインが必要です。</div>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-2"
    >
      <textarea
        className="w-full border rounded p-2"
        rows={3}
        placeholder="投稿内容を入力"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={!content.trim()}
      >
        投稿する
      </button>
    </form>
  );
}
