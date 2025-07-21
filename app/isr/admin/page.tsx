"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  tags: string[];
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  const updateField = (i: number, field: keyof Product, value: string) => {
    const updated = [...products];
    if (field === "price") {
      updated[i][field] = Number(value);
    } else if (field === "tags") {
      updated[i][field] = value.split(",").map((t) => t.trim());
    } else {
      updated[i][field] = value;
    }
    setProducts(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(products),
    });
    setLoading(false);
    alert("保存しました。60秒以内に静的ページが再生成されます。");
  };

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: `p${Date.now()}`,
        name: "",
        price: 0,
        description: "",
        category: "",
        tags: [],
      },
    ]);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">製品管理画面</h1>

      <button
        onClick={addProduct}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        製品を追加
      </button>

      <table className="w-full text-sm mt-4 border">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">名前</th>
            <th className="p-2">価格</th>
            <th className="p-2">カテゴリ</th>
            <th className="p-2">タグ (カンマ区切り)</th>
            <th className="p-2">説明</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr key={p.id} className="border-t">
              <td>
                <input
                  value={p.name}
                  onChange={(e) => updateField(i, "name", e.target.value)}
                  className="w-full border p-1"
                />
              </td>
              <td>
                <input
                  value={p.price}
                  onChange={(e) => updateField(i, "price", e.target.value)}
                  className="w-full border p-1"
                  type="number"
                />
              </td>
              <td>
                <input
                  value={p.category}
                  onChange={(e) => updateField(i, "category", e.target.value)}
                  className="w-full border p-1"
                />
              </td>
              <td>
                <input
                  value={p.tags.join(", ")}
                  onChange={(e) => updateField(i, "tags", e.target.value)}
                  className="w-full border p-1"
                />
              </td>
              <td>
                <input
                  value={p.description}
                  onChange={(e) =>
                    updateField(i, "description", e.target.value)
                  }
                  className="w-full border p-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleSave}
        className="px-6 py-2 bg-blue-600 text-white rounded"
        disabled={loading}
      >
        {loading ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
