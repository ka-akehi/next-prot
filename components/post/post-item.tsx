'use client';

import { usePostDelete } from '@/view_model/post/use-post-delete';
import { usePostEdit } from '@/view_model/post/use-post-edit';
import type { Post } from '@prisma/client';
import { PostActions } from './post-actions';
import { PostContent } from './post-content';
import { PostEditor } from './post-editor';

type PostWithUser = Post & {
  user?: {
    name?: string | null;
  };
};

type Props = {
  post: PostWithUser;
};

export function PostItem({ post }: Props) {
  const { remove, loading: isDeleting, error: deleteError } = usePostDelete(post.id);
  const {
    editing,
    startEdit,
    cancelEdit,
    content,
    setContent,
    save,
    loading: isUpdating,
    error: updateError,
  } = usePostEdit(post.id, post.content);

  return (
    <li className="relative border p-4 rounded space-y-2" data-testid="post-item" data-cy={post.id}>
      {editing ? (
        <>
          <PostEditor
            content={content}
            setContent={setContent}
            save={save}
            cancel={cancelEdit}
            loading={isUpdating}
            error={updateError}
          />
        </>
      ) : (
        <>
          <PostContent post={post} />
        </>
      )}

      {deleteError && (
        <p className="text-red-500 text-sm" data-testid="post-error-delete">
          {deleteError}
        </p>
      )}

      {!editing && <PostActions onEdit={startEdit} onDelete={remove} isDeleting={isDeleting} />}
    </li>
  );
}
