import { prisma } from '@infrastructure/persistence/prisma';

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return new Response(JSON.stringify(todos), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('GET /api/todos error:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch todos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req: Request) {
  try {
    const { title } = await req.json();
    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const newTodo = await prisma.todo.create({
      data: { title: title.trim() },
    });
    return new Response(JSON.stringify(newTodo), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('POST /api/todos error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create todo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
