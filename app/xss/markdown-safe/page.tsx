"use client";

import { marked } from "marked";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

export default function MarkdownXssSafe() {
  const [input, setInput] = useState("");
  const [html, setHtml] = useState("");

  useEffect(() => {
    const render = async () => {
      const result = await marked.parse(input);
      setHtml(DOMPurify.sanitize(result));
    };
    render();
  }, [input]);

  return (
    <div style={{ padding: 20 }}>
      <h2>🟢 対策済：Markdown + DOMPurify</h2>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={5}
        style={{ width: "100%" }}
      />
      <div
        style={{ marginTop: 20, border: "1px solid gray", padding: 20 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
