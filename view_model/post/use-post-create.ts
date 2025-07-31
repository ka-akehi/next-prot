'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { createPost } from './post-actions';

export function usePostCreate() {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const submit = useCallback(async () => {
    if (!content.trim()) {
      setError('投稿内容が空です');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', content.trim());

      await createPost(formData);
      setContent('');
      setError('');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }, [content, router]);

  return {
    content,
    setContent,
    error,
    submit,
  };
}
