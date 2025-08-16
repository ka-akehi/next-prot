'use client';

import ExportButtonView from '@/components/mypage/ExportButtonView';
import { useExportViewModel } from '@/view_model/use-export-view-model';

export default function ExportButton() {
  const { job, loading, startExport } = useExportViewModel();

  return (
    <ExportButtonView
      loading={loading}
      jobStatus={job?.status}
      jobProgress={job?.progress}
      filePath={job?.filePath}
      error={job?.error}
      onStartAction={startExport}
    />
  );
}
