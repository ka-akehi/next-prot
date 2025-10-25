import { getAllCategories, getProductsByCategory } from "@infrastructure/catalog/products";
import { notFound } from "next/navigation";
import Link from "next/link";

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({ category }));
}

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const products = await getProductsByCategory(category);

  if (!products || products.length === 0) return notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">カテゴリ: {category}</h1>
      <ul className="space-y-4">
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
    </div>
  );
}
