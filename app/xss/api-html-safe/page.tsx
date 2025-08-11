"use client";

import { useEffect, useState } from "react";

export default function ApiHtmlSafe() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch("/api/safe-html")
      .then((res) => res.text())
      .then(setHtml);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🟢 APIレスポンスのXSS対策済み表示</h2>
      <p>DOMPurify によってサニタイズ済のHTMLのみを描画しています。</p>
      <div
        style={{ border: "1px solid #aaa", padding: 20 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
