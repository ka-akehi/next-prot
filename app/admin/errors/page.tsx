import { ErrorLogTable } from '@/components/errors/error-log-table';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'エラーログ一覧 | Admin',
};

export default async function AdminErrorPage() {
  const [serverErrors, clientErrors] = await Promise.all([
    prisma.serverErrorLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.clientErrorLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
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
