import type { Post } from '@prisma/client';

type PostWithUser = Post & {
  user?: {
    name?: string | null;
  };
};

export function PostContent({ post }: { post: PostWithUser }) {
  return (
    <div>
      <p className="whitespace-pre-wrap" data-testid="post-content">
        {post.content}
      </p>
      {post.user?.name && (
        <p className="text-xs text-gray-500" data-testid="post-author">
          by {post.user.name}
        </p>
      )}
    </div>
  );
}
