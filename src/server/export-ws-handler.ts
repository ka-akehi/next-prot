import type WebSocket from 'ws';

export type ExportJobUpdate = {
  type: 'export-progress';
  jobId: string;
  progress: number; // 0〜100
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath?: string;
};

// global に保存するシングルトンの型
type ExportSubscribers = Map<string, Set<WebSocket>>;

// globalThis に型を追加
declare global {
  var __exportSubscribers: ExportSubscribers | undefined;
}

// シングルトン化された exportSubscribersz
export const exportSubscribers: ExportSubscribers =
  globalThis.__exportSubscribers ?? (globalThis.__exportSubscribers = new Map());

export function handleExportConnection(ws: WebSocket, jobId: string) {
  if (!exportSubscribers.has(jobId)) {
    exportSubscribers.set(jobId, new Set());
  }
  exportSubscribers.get(jobId)!.add(ws);

  ws.on('close', () => {
    exportSubscribers.get(jobId)?.delete(ws);
  });
}

export function broadcastExport(jobId: string, update: ExportJobUpdate) {
  const subs = exportSubscribers.get(jobId);
  if (!subs || subs.size === 0) {
    return;
  }
  for (const client of subs) {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(update));
    }
  }
}
