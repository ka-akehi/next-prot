import { ExportJobUpdate } from '@/server/export-ws-handler';
import { useEffect, useRef, useState } from 'react';

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface ExportJob {
  id: string;
  status: JobStatus;
  filePath?: string | null;
  error?: string | null;
  progress?: number | null;
}

export function useExportViewModel() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ExportJob | null>(null);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // エクスポート開始
  const startExport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/export', { method: 'POST' });
      if (!res.ok) throw new Error('Export request failed');
      const data = await res.json();

      setJobId(data.jobId);
      setJob({
        id: data.jobId,
        status: 'pending',
        progress: 0,
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
      throw err;
    }
  };

  // WebSocket で進捗監視
  useEffect(() => {
    if (!jobId) return;

    const socket = new WebSocket(`ws://localhost:3000/export?jobId=${encodeURIComponent(jobId)}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data: ExportJobUpdate = JSON.parse(event.data);
        if (data.type === 'export-progress' && data.jobId === jobId) {
          setJob({
            id: jobId,
            status: data.status,
            progress: data.progress,
            filePath: data.filePath ?? null,
          });
          if (data.status === 'completed' || data.status === 'failed') {
            setLoading(false);
            socket.close();
          }
        }
      } catch (err) {
        console.error('❌ Failed to parse WebSocket message:', err);
      }
    };

    socket.onerror = (err) => {
      console.error('❌ socket error:', err);
    };

    socket.onclose = () => {
      console.log('🔌 Export socket closed');
    };

    return () => {
      socket.close();
    };
  }, [jobId]);

  return {
    job,
    loading,
    startExport,
  };
}
