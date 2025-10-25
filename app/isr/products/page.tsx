import { getAllProducts } from "@infrastructure/catalog/products";
import Link from "next/link";

export const dynamic = "force-static"; // SSGとして明示的に生成

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">商品一覧</h1>
      <ul className="space-y-4">
        {products.map((product) => (
          <li key={product.id} className="border p-4 rounded shadow-sm">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p>¥{product.price}</p>
            <p className="text-sm text-gray-600">{product.description}</p>
            <Link
              href={`/products/${product.id}`}
              className="text-blue-500 underline mt-2 inline-block"
            >
              詳細を見る
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
