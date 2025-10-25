import * as ws from 'ws';

type ChatMessage =
  | { type: 'chat'; user: string; content: string; timestamp: string }
  | { type: 'system'; content: string }
  | { type: 'count'; count: number };

const chatRooms = new Map<string, Set<ws.WebSocket>>();

export function handleChatConnection(socket: ws.WebSocket, roomId: string) {
  if (!chatRooms.has(roomId)) chatRooms.set(roomId, new Set());
  chatRooms.get(roomId)!.add(socket);

  socket.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg.type === 'join') {
      socket.username = msg.user;
      broadcastChat(roomId, {
        type: 'system',
        content: `${msg.user} が入室しました`,
      });
      broadcastChatCount(roomId);
    }

    if (msg.type === 'chat') {
      broadcastChat(roomId, {
        type: 'chat',
        user: msg.user,
        content: msg.content,
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on('close', () => {
    chatRooms.get(roomId)?.delete(socket);
    if (chatRooms.get(roomId)?.size === 0) {
      chatRooms.delete(roomId);
    }
    if (socket.username) {
      broadcastChat(roomId, {
        type: 'system',
        content: `${socket.username} が退出しました`,
      });
    }
    broadcastChatCount(roomId);
  });
}

function broadcastChat(roomId: string, payload: ChatMessage) {
  const clients = chatRooms.get(roomId);
  if (!clients) return;
  const json = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === ws.WebSocket.OPEN) {
      client.send(json);
    }
  }
}

function broadcastChatCount(roomId: string) {
  const count = chatRooms.get(roomId)?.size || 0;
  broadcastChat(roomId, { type: 'count', count });
}
