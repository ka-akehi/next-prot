import { handleChatConnection } from '@/server/chat-ws-handler';
import { handleExportConnection } from '@/server/export-ws-handler';
import { createServer } from 'http';
import { parse } from 'url';
import * as ws from 'ws';

const server = createServer();
const wss = new ws.WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const { pathname, query } = parse(req.url || '', true);

  if (pathname === '/chat') {
    wss.handleUpgrade(req, socket, head, (wsSocket: ws.WebSocket) => {
      const roomId = typeof query.room === 'string' ? query.room : 'default';
      handleChatConnection(wsSocket, roomId);
    });
  }

  if (pathname === '/export') {
    wss.handleUpgrade(req, socket, head, (wsSocket: ws.WebSocket) => {
      const jobId = typeof query.jobId === 'string' ? query.jobId : '';
      handleExportConnection(wsSocket, jobId);
    });
  }
});

server.listen(4000, () => {
  console.log('✅ WebSocket server running on ws://localhost:4000');
});
