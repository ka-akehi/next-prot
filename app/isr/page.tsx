import { getAllProducts, getAllCategories, getAllTags } from "@/lib/products";
import Link from "next/link";

export const revalidate = 60; // ISR: 60秒ごとに再生成

export default async function HomePage() {
  const [products, categories, tags] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
    getAllTags(),
  ]);

  return (
    <div className="p-6 space-y-10">
      <section>
        <h1 className="text-3xl font-bold mb-4">製品一覧</h1>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <li key={product.id} className="border p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p>¥{product.price}</p>
              <Link
                href={`/isr/products/${product.id}`}
                className="text-blue-500 underline"
              >
                詳細を見る
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-2">カテゴリ一覧</h2>
        <ul className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <li key={category}>
              <Link
                href={`/isr/categories/${category}`}
                className="text-blue-600 underline"
              >
                {category}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-2">タグ一覧</h2>
        <ul className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <li key={tag}>
              <Link
                href={`/isr/tags/${tag}`}
                className="text-green-600 underline"
              >
                #{tag}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
