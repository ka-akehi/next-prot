import { useEffect, useState } from 'react';

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

  const startExport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/export', { method: 'POST' });
      if (!res.ok) throw new Error('Export request failed');
      const data = await res.json();
      setJobId(data.jobId);
    } catch (err) {
      console.error(err);
      setLoading(false);
      throw err;
    }
  };

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/export/${jobId}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Polling request failed');
        const data: ExportJob = await res.json();
        setJob(data);

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [jobId]);

  return {
    job,
    loading,
    startExport,
  };
}
