'use client';

import { deletePost } from '@/view_model/post/post-actions';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export function usePostDelete(postId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const remove = useCallback(async () => {
    try {
      setLoading(true);
      await deletePost(postId);
      router.refresh(); // ✅ 削除後に一覧を再取得
    } catch (err: unknown) {
      console.error(err);
      setError('削除に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [postId, router]);

  return { remove, loading, error };
}
