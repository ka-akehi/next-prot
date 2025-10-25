'use client';

import { ToDo } from '@/types/todo';
import { useEffect, useState } from 'react';

export function useTodos() {
  const [todos, setTodos] = useState<ToDo[]>([]);
  const [loading, setLoading] = useState(true);

  // 初期取得
  useEffect(() => {
    fetch('/api/todos')
      .then((res) => res.json())
      .then((data) => {
        setTodos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load todos:', err);
        setLoading(false);
      });
  }, []);

  // 追加
  const addTodo = async (text: string) => {
    if (!text.trim()) return;
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: text }),
    });
    if (!res.ok) throw new Error('Failed to add todo');
    const newTodo = await res.json();
    setTodos((prev) => [newTodo, ...prev]);
  };

  // 削除
  const deleteTodo = async (id: string) => {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete todo');
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  return { todos, loading, addTodo, deleteTodo };
}
