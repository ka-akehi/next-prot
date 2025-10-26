import { ErrorLogTable } from '@/components/errors/error-log-table';
import { findClientErrorLogs, findServerErrorLogs } from '@/repositories/error-logs/error-log.repository';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'エラーログ一覧 | Admin',
};

export default async function AdminErrorPage() {
  const [serverErrors, clientErrors] = await Promise.all([
    findServerErrorLogs({ take: 100 }, { createdAt: 'desc' }),
    findClientErrorLogs({ take: 100 }, { createdAt: 'desc' }),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">エラーログ一覧</h1>
      <ErrorLogTable title="Server Error Logs" type="server" logs={serverErrors} />
      <div className="h-8" />
      <ErrorLogTable title="Client Error Logs" type="client" logs={clientErrors} />
    </div>
  );
}
