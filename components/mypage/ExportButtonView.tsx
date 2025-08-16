'use client';

import ExportResult from './ExportResult';
import ProgressBar from './ProgressBar';

interface ExportButtonViewProps {
  loading: boolean;
  jobStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  jobProgress?: number | null;
  filePath?: string | null;
  error?: string | null;
  onStartAction: () => void;
}

export default function ExportButtonView({
  loading,
  jobStatus,
  jobProgress,
  filePath,
  error,
  onStartAction,
}: ExportButtonViewProps) {
  return (
    <div className="space-y-3">
      <button
        onClick={onStartAction}
        disabled={loading || jobStatus === 'processing'}
        className={`px-4 py-2 rounded text-white font-semibold shadow ${
          loading || jobStatus === 'processing' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading || jobStatus === 'processing' ? 'エクスポート中...' : 'CSVエクスポート'}
      </button>

      {jobStatus === 'processing' && <ProgressBar progress={jobProgress || 0} />}
      {(jobStatus === 'completed' || jobStatus === 'failed') && (
        <ExportResult status={jobStatus} filePath={filePath} error={error} />
      )}
    </div>
  );
}
