import { PostWithUser } from '@/types/post';
import { PostItem } from './post-item';

type Props = {
  posts: PostWithUser[];
};

export function PostList({ posts }: Props) {
  return (
    <ul className="space-y-4">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </ul>
  );
}
