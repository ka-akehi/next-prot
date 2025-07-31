import { PostItem } from '@/components/post';

type Props = {
  posts: {
    id: string;
    content: string;
    createdAt: Date;
    userId: string;
    user?: { name?: string | null };
  }[];
};

export function PostList({ posts }: Props) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
}
