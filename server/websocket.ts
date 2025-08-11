import * as ws from "ws";
import { createServer } from "http";
import { parse } from "url";

const server = createServer();
const wss = new ws.WebSocketServer({ noServer: true });

type ServerMessage =
  | {
      type: "chat";
      user: string;
      content: string;
      timestamp: string;
    }
  | {
      type: "system";
      content: string;
    }
  | {
      type: "count";
      count: number;
    };

// Map<roomId, Set<WebSocket>>
const rooms = new Map<string, Set<ws.WebSocket>>();

server.on("upgrade", (req, socket, head) => {
  const { query } = parse(req.url || "", true);
  const roomId = typeof query.room === "string" ? query.room : "default";

  wss.handleUpgrade(req, socket, head, (socket) => {
    socket.roomId = roomId;

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId)!.add(socket);

    wss.emit("connection", socket, req);
  });
});

wss.on("connection", (wsSocket) => {
  const socket = wsSocket as ws.WebSocket; // 型補完のためキャスト
  const roomId = socket.roomId || "default";

  socket.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg.type === "join") {
      socket.username = msg.user;
      broadcast(roomId, {
        type: "system",
        content: `${msg.user} が入室しました`,
      });
      broadcastCount(roomId);
      return;
    }

    if (msg.type === "chat") {
      broadcast(roomId, {
        type: "chat",
        user: msg.user,
        content: msg.content,
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on("close", () => {
    const roomClients = rooms.get(roomId);
    if (roomClients) {
      roomClients.delete(socket);
      if (roomClients.size === 0) {
        rooms.delete(roomId);
      }
    }

    if (socket.username) {
      broadcast(roomId, {
        type: "system",
        content: `${socket.username} が退出しました`,
      });
    }

    broadcastCount(roomId);
  });
});

function broadcast(roomId: string, payload: ServerMessage) {
  const clients = rooms.get(roomId);
  if (!clients) return;

  const json = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

function broadcastCount(roomId: string) {
  const count = rooms.get(roomId)?.size || 0;
  broadcast(roomId, {
    type: "count",
    count,
  });
}

server.listen(4000, () => {
  console.log("✅ WebSocket server running on ws://localhost:4000");
});
