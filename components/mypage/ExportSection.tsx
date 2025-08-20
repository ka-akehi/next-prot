'use client';

import ExportButton from '@/components/mypage/ExportButton';

export default function ExportSection() {
  return (
    <section className="border p-4 rounded bg-gray-50">
      <h2 className="text-lg font-semibold mb-2">投稿のCSVエクスポート</h2>
      <ExportButton />
    </section>
  );
}
