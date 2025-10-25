'use client';

import { POST_ERROR_MESSAGES } from '@domain/messages/error.messages';
import { createPost } from '@/view_model/post/post-actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function usePostCreate(userId: string) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const submit = async () => {
    try {
      setError('');
      await createPost({
        content: content.trim(),
        userId,
      });
      setContent('');
      router.refresh(); // ✅ 投稿後にリストを再取得
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : POST_ERROR_MESSAGES.createFallback);
    }
  };

  return {
    content,
    setContent,
    error,
    submit,
  };
}
