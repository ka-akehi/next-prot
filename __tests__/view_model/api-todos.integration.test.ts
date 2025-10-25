// 速度を意識していないテスト
// 実際のAPI呼び出しを行い、データベースとの統合を確認
// 依存関係のモックは使用せず、実際のAPIエンドポイントをテスト
import { DELETE as DELETE_TODO } from '@/app/api/todos/[id]/route';
import { GET as GET_TODOS, POST as POST_TODO } from '@/app/api/todos/route';
import { prisma } from '@infrastructure/persistence/prisma';
import type { ToDo } from '@/types/todo';
import { describe, expect } from '@jest/globals';

/**
 * @jest-environment node
 */
describe('Route Handlers: /api/todos (integration-ish)', () => {
  beforeAll(async () => {
    await prisma.todo.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST -> GET -> DELETE -> GET', async () => {
    // POST
    const postReq = new Request('http://localhost/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'jest int todo' }),
    });
    const postRes = (await POST_TODO(postReq)) as Response;
    expect(postRes.status).toBe(200);
    const created: ToDo = await postRes.json();
    expect(created.title).toBe('jest int todo');

    // GET（作成済が含まれること）
    const getRes1 = (await GET_TODOS()) as Response;
    expect(getRes1.status).toBe(200);
    const list1: ToDo[] = await getRes1.json();
    expect(Array.isArray(list1)).toBe(true);
    expect(list1.some((t) => t.id === created.id)).toBe(true);

    // DELETE（params は Promise で渡す）
    const delRes = (await DELETE_TODO(new Request(`http://localhost/api/todos/${created.id}`, { method: 'DELETE' }), {
      params: Promise.resolve({ id: created.id }),
    })) as Response;
    expect(delRes.status).toBe(200);

    // GET（削除されていること）
    const getRes2 = (await GET_TODOS()) as Response;
    const list2: ToDo[] = await getRes2.json();
    expect(list2.some((t) => t.id === created.id)).toBe(false);
  });
});
