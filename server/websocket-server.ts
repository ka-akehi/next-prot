import { handleChatConnection } from '@/server/chat-ws-handler'; // ← chat用ハンドラ（既存）
import { handleExportConnection } from '@/server/export-ws-handler'; // ← export用のハンドラ
import { parse } from 'url';
import { WebSocketServer } from 'ws';

// WebSocketサーバーをポート3000で直接起動
const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws, req) => {
  if (!req.url) return;

  const { pathname, query } = parse(req.url, true);

  // エクスポート用
  if (pathname === '/export') {
    const jobId = typeof query.jobId === 'string' ? query.jobId : '';
    handleExportConnection(ws, jobId);
    return;
  }

  // チャット用
  if (pathname === '/chat') {
    const roomId = typeof query.room === 'string' ? query.room : 'default';
    handleChatConnection(ws, roomId);
    return;
  }

  // 未知の接続
  ws.close();
});

console.log('🚀 WebSocket server running on ws://localhost:3000');
