'use client';
import { useState } from 'react';

type Props = {
  onAddAction: (text: string) => Promise<void> | void;
};

export function ToDoForm({ onAddAction }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    try {
      setLoading(true);
      await onAddAction(text.trim());
      setText('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4" data-testid="todo-form">
      <input
        className="border px-4 py-2 flex-1 rounded"
        type="text"
        placeholder="タスクを入力"
        value={text}
        onChange={(e) => setText(e.target.value)}
        data-testid="todo-input"
        disabled={loading}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
        data-testid="todo-add"
      >
        {loading ? '追加中…' : '追加'}
      </button>
    </form>
  );
}
