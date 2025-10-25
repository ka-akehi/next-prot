'use client';

export function TestClient() {
  // ボタンクリックでクライアント例外を投げる
  return (
    <button
      onClick={() => {
        throw new Error('🟦 Client error for test');
      }}
      className="text-red-600"
    >
      クライアントエラーを発生
    </button>
  );
}
