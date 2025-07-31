'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { deletePost } from './post-actions';

export function usePostDelete() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const remove = useCallback(
    async (postId: string) => {
      try {
        setLoadingId(postId);
        await deletePost(postId);
        router.refresh();
      } catch (err) {
        alert((err as Error).message);
      } finally {
        setLoadingId(null);
      }
    },
    [router]
  );

  return {
    remove,
    loadingId,
  };
}
