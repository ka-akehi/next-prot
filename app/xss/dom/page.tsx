"use client";

import { useEffect } from "react";

export default function DomXssTest() {
  useEffect(() => {
    const hash = decodeURIComponent(location.hash.slice(1));
    const el = document.getElementById("target");
    if (el) el.innerHTML = hash;
    console.log("inserted html:", hash);
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>DOM XSS テスト</h1>
      <p>
        例: <code>#&lt;img src=x onerror=alert(&#39;XSS&#39;)&gt;</code>
      </p>
      <div
        id="target"
        style={{ border: "1px solid gray", padding: 20, marginTop: 20 }}
      />
    </div>
  );
}
