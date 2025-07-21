import fs from "fs/promises";
import path from "path";

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  tags: string[];
};

export async function getAllProducts(): Promise<Product[]> {
  const filePath = path.join(process.cwd(), "public", "products.json");
  const json = await fs.readFile(filePath, "utf-8");
  return JSON.parse(json);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getAllProducts();
  return products.find((p) => p.id === id);
}

export async function getProductsByCategory(
  category: string
): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter((p) => p.category === category);
}

export async function getProductsByTag(tag: string): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter((p) => p.tags.includes(tag));
}

export async function getAllCategories(): Promise<string[]> {
  const products = await getAllProducts();
  return [...new Set(products.map((p) => p.category))];
}

export async function getAllTags(): Promise<string[]> {
  const products = await getAllProducts();
  return [...new Set(products.flatMap((p) => p.tags))];
}
