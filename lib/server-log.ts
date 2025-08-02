export async function logServerError(error: unknown, context: string) {
  const payload = {
    type: 'server-error',
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : '',
    timestamp: Date.now(),
  };

  console.error('[SERVER ERROR]', payload); // ✅ Dev確認用

  // 必要ならDB保存やSentry連携など
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/log-server-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('ログ送信に失敗', e);
  }
}
