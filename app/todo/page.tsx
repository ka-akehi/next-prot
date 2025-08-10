'use client';

import { ToDoForm, ToDoList } from '@/components/todo';
import { useTodos } from '@/view_model/use-tools';

export default function ToDoPage() {
  const { todos, loading, addTodo, deleteTodo } = useTodos();

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold">ToDoアプリ（PWA対応）</h1>
      {loading ? (
        <p data-testid="loading">Loading...</p>
      ) : (
        <>
          <ToDoForm onAddAction={addTodo} />
          <ToDoList todos={todos} onDeleteAction={deleteTodo} />
        </>
      )}
    </main>
  );
}
