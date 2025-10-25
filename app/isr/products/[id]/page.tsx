import { getAllProducts, getProductById } from "@infrastructure/catalog/products";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({ id: product.id }));
}

export const revalidate = 60; // ISR: 60秒ごとに再生成

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="text-lg">¥{product.price}</p>
      <p className="mt-2 text-gray-700">{product.description}</p>
      <p className="text-xs text-gray-400 mt-4">
        Last generated: {new Date().toISOString()}
      </p>
    </div>
  );
}
