export type ExportJobUpdate = {
  type: 'export-progress';
  jobId: string;
  progress: number; // 0〜100
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath?: string;
};
