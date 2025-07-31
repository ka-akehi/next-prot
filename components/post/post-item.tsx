'use client';

import { PostActions } from '@/components/post/post-actions';
import { PostContent } from '@/components/post/post-content';
import { PostEditForm } from '@/components/post/post-edit-form';
import { usePostDelete } from '@/view_model/post/use-post-delete';
import { usePostEdit } from '@/view_model/post/use-post-edit';
import { useSession } from 'next-auth/react';

type Props = {
  post: {
    id: string;
    content: string;
    userId: string;
    user?: { name?: string | null };
    createdAt: Date;
  };
};

export function PostItem({ post }: Props) {
  const { data: session } = useSession();
  const { remove, loadingId } = usePostDelete();
  const { editing, content, error, loading, setContent, start, cancel, save } = usePostEdit(post.content);

  const isOwner = session?.user?.id === post.userId;

  return (
    <div className="border p-4 rounded shadow-sm relative space-y-2">
      {editing ? (
        <PostEditForm
          content={content}
          setContent={setContent}
          error={error}
          loading={loading}
          onSave={() => save(post.id)}
          onCancel={cancel}
        />
      ) : (
        <>
          <PostContent post={post} />
          {isOwner && (
            <PostActions onEdit={start} onDelete={() => remove(post.id)} isDeleting={loadingId === post.id} />
          )}
        </>
      )}
    </div>
  );
}
