import { Post } from "@/app/posts/page";

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  const posts: Post[] = await res.json();

  return posts.map((post) => ({
    id: post.id.toString(),
  }));
}

type Props = { params: Promise<{ id: string }> };

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
    cache: "force-cache",
  });
  const post = await res.json();

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </div>
  );
}
