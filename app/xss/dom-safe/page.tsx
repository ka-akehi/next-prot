"use client";

import { useEffect, useState } from "react";

export default function DomXssSafe() {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(decodeURIComponent(location.hash.slice(1)));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🟢 DOM XSS 対策：textContent / JSX</h2>
      <p>
        例: <code>#&lt;img src=x onerror=alert(1)&gt;</code>
      </p>
      <div style={{ border: "1px solid #aaa", padding: 10 }}>{text}</div>
    </div>
  );
}
