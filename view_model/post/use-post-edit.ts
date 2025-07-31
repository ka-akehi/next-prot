'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { updatePost } from './post-actions';

export function usePostEdit(initialContent: string) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const start = useCallback(() => {
    setEditing(true);
  }, []);

  const cancel = useCallback(() => {
    setContent(initialContent);
    setEditing(false);
  }, [initialContent]);

  const save = useCallback(
    async (postId: string) => {
      if (!content.trim()) {
        setError('内容を入力してください');
        return;
      }

      try {
        setLoading(true);
        await updatePost(postId, content.trim());
        setEditing(false);
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [content, router]
  );

  return {
    editing,
    content,
    error,
    loading,
    setContent,
    start,
    cancel,
    save,
  };
}
