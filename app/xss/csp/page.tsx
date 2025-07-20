"use client";

import { useEffect, useState } from "react";

export default function CspXssTestPage() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    const template = `<img src=x onerror="alert('XSS blocked by CSP')">`;
    setHtml(template);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🛡️ CSPテストページ</h2>
      <p>
        このページは CSP
        によりインラインスクリプトや一部属性がブロックされます。
      </p>
      <div
        style={{ border: "1px solid #aaa", padding: 20 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
