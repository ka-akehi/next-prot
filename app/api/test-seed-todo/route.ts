import { createTodo, deleteAllTodos } from '@/repositories/todos/todo.repository';

export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    // 既存のTodoを全削除
    await deleteAllTodos();

    // 新規作成
    const todo = await createTodo({
      title: title || `seed todo ${Date.now()}`,
    });

    return new Response(JSON.stringify(todo), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('POST /api/test-seed-todo error:', error);
    return new Response(JSON.stringify({ error: 'Failed to seed todo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
