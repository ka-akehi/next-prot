'use client';

import { ArrowDownTrayIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface ExportResultProps {
  status: 'completed' | 'failed';
  filePath?: string | null;
  error?: string | null;
}

export default function ExportResult({ status, filePath, error }: ExportResultProps) {
  if (status === 'completed' && filePath) {
    return (
      <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 p-3 rounded">
        <CheckCircleIcon className="h-5 w-5" />
        <span>エクスポートが完了しました！</span>
        <a
          href={filePath}
          download
          className="ml-auto flex items-center gap-1 text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          ダウンロード
        </a>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 p-3 rounded">
        <XCircleIcon className="h-5 w-5" />
        <span>エクスポートに失敗しました</span>
        {error && <span className="text-xs text-gray-500">({error})</span>}
      </div>
    );
  }

  return null;
}
