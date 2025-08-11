"use client";

import { useEffect, useState } from "react";

export default function ApiHtmlXssDemo() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch("/api/unsafe-html")
      .then((res) => res.text())
      .then(setHtml);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🔴 APIレスポンスからのXSS</h2>
      <p>APIレスポンスに含まれるHTMLをそのまま描画しています。</p>
      <div
        style={{ border: "1px solid #aaa", padding: 20 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
