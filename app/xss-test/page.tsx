// XSSテスト用ページ：dangerouslySetInnerHTMLで意図的なXSSを再現
"use client";

import React, { useState } from "react";

export default function XssTestPage() {
  const [userInput, setUserInput] = useState("");

  return (
    <div style={{ padding: 40 }}>
      <h1>XSS テストページ</h1>

      <label>
        入力（HTMLとして扱われます）:
        <textarea
          rows={5}
          style={{ width: "100%", marginTop: 10 }}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={`例: <img src=x onerror="alert('XSS')">`}
        />
      </label>

      <hr style={{ margin: "30px 0" }} />

      <div>
        <h2>出力結果（innerHTML）:</h2>
        <div
          style={{
            border: "1px solid #aaa",
            padding: 20,
            minHeight: 100,
            background: "#f9f9f9",
          }}
          dangerouslySetInnerHTML={{ __html: userInput }}
        />
      </div>
    </div>
  );
}
