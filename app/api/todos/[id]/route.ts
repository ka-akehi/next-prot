import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.todo.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to delete todo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
