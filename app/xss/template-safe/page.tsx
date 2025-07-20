"use client";

import { useEffect, useState } from "react";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function TemplateXssSafeHydrated() {
  const [name, setName] = useState("");
  const [safeHtml, setSafeHtml] = useState("");

  // ✅ hydration 完了後にエスケープしたHTMLを innerHTML に差し込む
  useEffect(() => {
    const escaped = escapeHtml(name);
    const template = `<p>こんにちは、${escaped} さん</p>`;
    setSafeHtml(template);
  }, [name]);

  return (
    <div style={{ padding: 20 }}>
      <h2>🟢 テンプレートXSS 対策済（Hydration後挿入）</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={`例: <img src=x onerror=alert('XSS')>`}
        style={{ width: "100%", marginBottom: 20 }}
      />
      <div
        style={{ border: "1px solid gray", padding: 20 }}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  );
}
