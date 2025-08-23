'use client';

import { usePollViewModel } from '@/view_model/polls/poll';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function PollPage() {
  const { poll, loading, error, handleVote } = usePollViewModel();

  if (error) return <p className="text-red-600">{error}</p>;
  if (!poll) return <p>読み込み中...</p>;

  return (
    <div className="flex flex-col items-center p-8 w-full">
      <h1 className="text-2xl font-bold mb-6">{poll.question}</h1>

      {/* ✅ 投票一覧 */}
      <ul className="w-full max-w-md mb-6">
        {poll.options.map((opt) => (
          <li key={opt.id} className="flex justify-between items-center border-b py-2">
            <span>
              {opt.text} ({opt.votes}票)
            </span>
            <button
              onClick={() => handleVote(opt.id)}
              disabled={loading}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              投票
            </button>
          </li>
        ))}
      </ul>

      {/* ✅ 棒グラフ表示 */}
      <div className="w-full max-w-xl h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={poll.options}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="text" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="votes" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
