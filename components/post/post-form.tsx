'use client';

import { usePostCreate } from '@/view_model/post/use-post-create';

type Props = {
  userId: string;
};

export function PostForm({ userId }: Props) {
  const { content, setContent, error, submit } = usePostCreate(userId);

  // useEffect(() => {
  //   throw new Error('🧪 Test error for GlobalError');
  // }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-2"
      data-testid="post-form"
    >
      <textarea
        className="w-full border p-2 rounded"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        data-testid="post-body"
      />
      {error && (
        <p className="text-red-500 text-sm" data-testid="post-error">
          {error}
        </p>
      )}
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" data-testid="submit-post">
        投稿
      </button>
    </form>
  );
}
