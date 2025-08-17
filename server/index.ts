import { handleChatConnection } from '@/server/chat-ws-handler';
import { handleExportConnection } from '@/server/export-ws-handler';
import { createServer } from 'http';
import next from 'next';
import { parse } from 'url';
import { WebSocketServer } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const { pathname, query } = parse(req.url || '', true);

    if (pathname === '/chat') {
      wss.handleUpgrade(req, socket, head, (wsSocket) => {
        handleChatConnection(wsSocket, typeof query.room === 'string' ? query.room : 'default');
      });
    }

    if (pathname === '/export') {
      wss.handleUpgrade(req, socket, head, (wsSocket) => {
        handleExportConnection(wsSocket, typeof query.jobId === 'string' ? query.jobId : '');
      });
    }
  });

  server.listen(3000, () => {
    console.log('✅ Next.js + WebSocket server running on http://localhost:3000');
  });
});
