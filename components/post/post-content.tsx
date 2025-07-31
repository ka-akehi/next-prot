type Props = {
  post: {
    content: string;
    createdAt: Date;
    user?: { name?: string | null };
  };
};

export function PostContent({ post }: Props) {
  return (
    <>
      <p className="whitespace-pre-wrap">{post.content}</p>
      <div className="text-xs text-gray-500 mt-1">
        {post.user?.name || '匿名'} - {new Date(post.createdAt).toLocaleString()}
      </div>
    </>
  );
}
