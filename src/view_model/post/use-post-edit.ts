'use client';

import { POST_ERROR_MESSAGES } from '@domain/messages/error.messages';
import { updatePost } from '@/view_model/post/post-actions';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export function usePostEdit(postId: string, initialContent: string) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const startEdit = () => setEditing(true);

  const cancelEdit = () => {
    setContent(initialContent);
    setEditing(false);
    setError(null);
  };

  const save = useCallback(async () => {
    if (!content.trim()) {
      setError(POST_ERROR_MESSAGES.validationRequired);
      return;
    }

    try {
      setLoading(true);
      await updatePost(postId, content.trim());
      router.refresh(); // ✅ 編集結果を即時反映
      setEditing(false);
      setError(null);
    } catch (err: unknown) {
      console.error(err);
      setError(POST_ERROR_MESSAGES.updateFailed);
    } finally {
      setLoading(false);
    }
  }, [postId, content, router]);

  return {
    editing,
    startEdit,
    cancelEdit,
    content,
    setContent,
    save,
    loading,
    error,
  };
}
