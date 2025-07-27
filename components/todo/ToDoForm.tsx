import { useState } from 'react';

type Props = {
  onAdd: (text: string) => void;
};

export function ToDoForm({ onAdd }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <input
        className="border px-4 py-2 flex-1 rounded"
        type="text"
        placeholder="タスクを入力"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        追加
      </button>
    </form>
  );
}
