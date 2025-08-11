"use client";

import { useEffect, useState } from "react";

export default function TemplateXssDemo() {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("");

  // HTMLを挿入するタイミングを hydration 完了後に遅延
  useEffect(() => {
    const t = `<p>こんにちは、${name} さん</p>`;
    setTemplate(t);
  }, [name]);

  return (
    <div style={{ padding: 20 }}>
      <h2>🔴 テンプレートXSS（React Hydration回避済）</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={`例: <img src=x onerror=alert('XSS')>`}
        style={{ width: "100%", marginBottom: 20 }}
      />
      <div
        style={{ border: "1px solid gray", padding: 20 }}
        dangerouslySetInnerHTML={{ __html: template }}
      />
    </div>
  );
}
