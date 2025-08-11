// 速度を意識したテスト
// 依存関係のモックを使用して、API呼び出しを高速化
// これにより、実際のAPI呼び出しを行わずに、ローカルのデータを使用してテストを実行
import { ToDo } from '@/types/todo';
import { useTodos } from '@/view_model/use-tools';
import { describe, expect, test } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

/**
 * @jest-environment jsdom
 */
describe('useTodos (fast)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('🚀 fetchモックで初期ロード＆追加', async () => {
    const mockTodos: ToDo[] = [{ id: '1', title: 'test todo', createdAt: new Date().toISOString() }];

    global.fetch = jest
      .fn()
      // 初回 GET
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos,
      })
      // 2回目 POST
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '2', title: 'new todo', createdAt: new Date().toISOString() }),
      });

    const { result } = renderHook(() => useTodos());

    // 初期ロードが反映されるまで待つ
    await waitFor(() => {
      expect(result.current.todos).toHaveLength(1);
    });

    // 追加
    await act(async () => {
      await result.current.addTodo('new todo');
    });
    expect(result.current.todos).toHaveLength(2);
  });
});
