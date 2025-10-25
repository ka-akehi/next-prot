// app/admin/errors/components/error-log-table.tsx
'use client';

import { deleteErrorLog } from '@/app/api/admin/errors/actions';

type Log = {
  id: string;
  message: string;
  stack?: string | null;
  pathname: string;
  userAgent: string;
  createdAt: string;
};

type Props = {
  title: string;
  type: 'server' | 'client';
  logs: Log[];
};

export function ErrorLogTable({ title, type, logs }: Props) {
  const handleDelete = async (id: string) => {
    await deleteErrorLog(type, id);
    window.location.reload(); // or use router.refresh() if you wrap in useRouter()
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">日時</th>
              <th className="p-2">メッセージ</th>
              <th className="p-2">パス</th>
              <th className="p-2">UA</th>
              <th className="p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-2">{log.message}</td>
                <td className="p-2">{log.pathname}</td>
                <td className="p-2 max-w-xs truncate">{log.userAgent}</td>
                <td className="p-2">
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(log.id)}>
                    削除
                  </button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td className="p-2" colSpan={5}>
                  ログはありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
