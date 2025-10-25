'use client';

import { useExportViewModel } from '@/view_model/use-export-view-model';
import ExportButtonView from './ExportButtonView';

export default function ExportButtonContainer() {
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
