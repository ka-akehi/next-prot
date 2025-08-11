'use client';

import { ToDo } from '@/types/todo';
import { useState } from 'react';

type Props = {
  todos: ToDo[];
  onDeleteAction: (id: string) => Promise<void> | void;
};

export function ToDoList({ todos, onDeleteAction }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (loadingId) return; // 他の削除中は無効
    try {
      setLoadingId(id);
      await onDeleteAction(id);
    } finally {
      setLoadingId(null);
    }
  };

  if (todos.length === 0) {
    return (
      <p className="text-sm text-gray-500 mt-4" data-testid="todo-empty">
        タスクはありません。
      </p>
    );
  }

  return (
    <ul className="mt-6 space-y-2" data-testid="todo-list">
      {todos.map((todo) => (
        <li key={todo.id} className="flex justify-between border-b pb-2" data-testid={`todo-item-${todo.id}`}>
          <span data-testid="todo-title">{todo.title}</span>
          <button
            className="text-red-500 hover:underline disabled:opacity-50"
            onClick={() => handleDelete(todo.id)}
            disabled={loadingId === todo.id}
            data-testid="todo-delete"
          >
            {loadingId === todo.id ? '削除中…' : '削除'}
          </button>
        </li>
      ))}
    </ul>
  );
}
