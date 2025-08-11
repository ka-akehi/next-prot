"use client";

import React, { useState } from "react";

export default function SafePlainTextOutput() {
  const [userInput, setUserInput] = useState("");

  return (
    <div style={{ padding: 40 }}>
      <h1>安全な出力（dangerouslySetInnerHTML 不使用）</h1>

      <label>
        入力（プレーンテキストで出力されます）:
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
        <h2>出力結果:</h2>
        <p>
          Next.jsではdangerouslySetInnerHTMLを使わないだけで9割XSSが防げるらしい
        </p>
        <div
          style={{
            whiteSpace: "pre-wrap",
            border: "1px solid #aaa",
            padding: 20,
            minHeight: 100,
            background: "#f9f9f9",
          }}
        >
          {userInput}
        </div>
      </div>
    </div>
  );
}
