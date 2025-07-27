'use client';

import { ToDoForm, ToDoList } from '@/components/todo';
import { ToDo } from '@/types/todo';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'my-todo-list';

export default function ToDoPage() {
  const [todos, setTodos] = useState<ToDo[]>([]);

  // ✅ 初期化：localStorage から読み込み
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setTodos(parsed);
        }
      } catch (e) {
        console.error('ToDoデータの復元に失敗:', e);
      }
    }
  }, []);

  // ✅ 変更時：localStorage に保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const handleAdd = (text: string) => {
    setTodos((prev) => [...prev, { id: uuidv4(), text }]);
  };

  const handleDelete = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold">ToDoアプリ（PWA対応）</h1>
      <ToDoForm onAdd={handleAdd} />
      <ToDoList todos={todos} onDelete={handleDelete} />
    </main>
  );
}
