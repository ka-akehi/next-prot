import * as ws from 'ws';

export type ExportJobUpdate = {
  type: 'export-progress';
  jobId: string;
  progress: number; // 0〜100
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath?: string;
};

const exportSubscribers = new Map<string, Set<ws.WebSocket>>();

export function handleExportConnection(socket: ws.WebSocket, jobId: string) {
  if (!exportSubscribers.has(jobId)) exportSubscribers.set(jobId, new Set());
  exportSubscribers.get(jobId)!.add(socket);

  socket.on('close', () => {
    exportSubscribers.get(jobId)?.delete(socket);
    if (exportSubscribers.get(jobId)?.size === 0) {
      exportSubscribers.delete(jobId);
    }
  });
}

export function broadcastExport(jobId: string, payload: ExportJobUpdate) {
  const clients = exportSubscribers.get(jobId);
  if (!clients) return;
  const json = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === ws.WebSocket.OPEN) {
      client.send(json);
    }
  }
}
