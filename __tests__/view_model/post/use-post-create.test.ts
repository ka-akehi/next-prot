import { createPost } from '@/view_model/post/post-actions';
import { usePostCreate } from '@/view_model/post/use-post-create';
import { describe, expect } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { useRouter } from 'next/navigation';

jest.mock('@/view_model/post/post-actions', () => ({
  createPost: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('usePostCreate', () => {
  const mockRouterRefresh = jest.fn();
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      refresh: mockRouterRefresh,
    });
  });

  it('初期値の比較', () => {
    const { result } = renderHook(() => usePostCreate(mockUserId));

    expect(result.current.content).toBe('');
    expect(result.current.error).toBe('');
    expect(typeof result.current.setContent).toBe('function');
    expect(typeof result.current.submit).toBe('function');
  });

  it('setContentが呼び出された時に更新されていること', () => {
    const { result } = renderHook(() => usePostCreate(mockUserId));

    act(() => {
      result.current.setContent('New content');
    });

    expect(result.current.content).toBe('New content');
  });

  it('submitが成功した場合にcreatePostが呼び出され、ルーターがリフレッシュされること', async () => {
    (createPost as jest.Mock).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => usePostCreate(mockUserId));

    act(() => {
      result.current.setContent('Test content');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(createPost).toHaveBeenCalledWith({
      content: 'Test content',
      userId: mockUserId,
    });
    expect(result.current.content).toBe('');
    expect(result.current.error).toBe('');
    expect(mockRouterRefresh).toHaveBeenCalled();
  });

  it('createPost がエラーを発生させた場合、エラーメッセージを設定する', async () => {
    const errorMessage = 'Failed to create post';
    (createPost as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => usePostCreate(mockUserId));

    act(() => {
      result.current.setContent('Test content');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(createPost).toHaveBeenCalledWith({
      content: 'Test content',
      userId: mockUserId,
    });
    expect(result.current.error).toBe(errorMessage);
    expect(mockRouterRefresh).not.toHaveBeenCalled();
  });

  it('createPost メソッドが Error 以外のオブジェクトを投げた場合、汎用的なエラーメッセージを設定する。', async () => {
    (createPost as jest.Mock).mockRejectedValueOnce('Unknown error');

    const { result } = renderHook(() => usePostCreate(mockUserId));

    act(() => {
      result.current.setContent('Test content');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(createPost).toHaveBeenCalledWith({
      content: 'Test content',
      userId: mockUserId,
    });
    expect(result.current.error).toBe('投稿に失敗しました');
    expect(mockRouterRefresh).not.toHaveBeenCalled();
  });
});
