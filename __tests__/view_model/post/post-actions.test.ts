import { getAuthSession } from '@infrastructure/auth/auth';
import { GENERAL_ERROR_MESSAGES, POST_ERROR_MESSAGES } from '@domain/messages/error.messages';
import { prisma } from '@infrastructure/persistence/prisma';
import { createPost, deletePost, updatePost } from '@/view_model/post/post-actions';
import { describe, expect } from '@jest/globals';

global.fetch = jest.fn(); // or jest.fn()

jest.mock('@infrastructure/auth/auth', () => ({
  getAuthSession: jest.fn(),
}));

describe('createPost', () => {
  const mockPost = { id: '1', content: 'テスト投稿', userId: 'user-123' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常に投稿を作成できる', async () => {
    // prisma.post.create を成功するモックとして設定
    prisma.post.create = jest.fn().mockResolvedValueOnce(mockPost);

    const result = await createPost({
      content: 'テスト投稿',
      userId: 'user-123',
    });

    // 結果を検証
    expect(result).toEqual(mockPost);

    // prisma.post.create が正しく呼び出されたことを検証
    expect(prisma.post.create).toHaveBeenCalledWith({
      data: {
        content: 'テスト投稿',
        userId: 'user-123',
      },
    });
  });

  it('投稿失敗時に例外をスローする', async () => {
    // prisma.post.create を失敗するモックとして設定
    prisma.post.create = jest.fn().mockRejectedValueOnce(new Error('DBエラー'));

    await expect(createPost({ content: '失敗投稿', userId: 'user-123' })).rejects.toThrow(
      POST_ERROR_MESSAGES.createFailed
    );

    // prisma.post.create が呼び出されたことを検証
    expect(prisma.post.create).toHaveBeenCalledWith({
      data: {
        content: '失敗投稿',
        userId: 'user-123',
      },
    });
  });
});

describe('deletePost', () => {
  const mockPost = { userId: 'user-123' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ログインしていない場合に例外をスローする', async () => {
    // getAuthSession を未ログイン状態にモック
    (getAuthSession as jest.Mock).mockResolvedValueOnce(null);

    await expect(deletePost('post-123')).rejects.toThrow(GENERAL_ERROR_MESSAGES.authRequired);
  });

  it('削除権限がない場合に例外をスローする', async () => {
    // getAuthSession を別ユーザーのセッションにモック
    (getAuthSession as jest.Mock).mockResolvedValueOnce({
      user: { id: 'user-456' },
    });

    // prisma.post.findUnique をモック
    prisma.post.findUnique = jest.fn().mockResolvedValueOnce(mockPost);

    await expect(deletePost('post-123')).rejects.toThrow(POST_ERROR_MESSAGES.deleteUnauthorized);
  });

  it('正常に投稿を削除できる', async () => {
    // getAuthSession をログイン済みユーザーにモック
    (getAuthSession as jest.Mock).mockResolvedValueOnce({
      user: { id: 'user-123' },
    });

    // prisma.post.findUnique と prisma.post.delete をモック
    prisma.post.findUnique = jest.fn().mockResolvedValueOnce(mockPost);
    prisma.post.delete = jest.fn().mockResolvedValueOnce({});

    // prisma.post.delete が正しく呼び出されたことを検証
    await expect(deletePost('post-123')).resolves.not.toThrow();

    expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 'post-123' } });
  });
});

describe('updatePost', () => {
  const mockPost = { userId: 'user-123' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ログインしていない場合に例外をスローする', async () => {
    // getAuthSession を未ログイン状態にモック
    (getAuthSession as jest.Mock).mockResolvedValueOnce(null);

    await expect(updatePost('post-123', '新しい内容')).rejects.toThrow(
      GENERAL_ERROR_MESSAGES.authRequired
    );
  });

  it('編集権限がない場合に例外をスローする', async () => {
    // getAuthSession を別ユーザーのセッションにモック
    (getAuthSession as jest.Mock).mockResolvedValueOnce({
      user: { id: 'user-456' },
    });

    // prisma.post.findUnique をモック
    prisma.post.findUnique = jest.fn().mockResolvedValueOnce(mockPost);

    await expect(updatePost('post-123', '新しい内容')).rejects.toThrow(
      POST_ERROR_MESSAGES.updateUnauthorized
    );
  });

  it('正常に投稿を更新できる', async () => {
    // getAuthSession をログイン済みユーザーにモック
    (getAuthSession as jest.Mock).mockResolvedValueOnce({
      user: { id: 'user-123' },
    });

    // prisma.post.findUnique と prisma.post.update をモック
    prisma.post.findUnique = jest.fn().mockResolvedValueOnce(mockPost);
    prisma.post.update = jest.fn().mockResolvedValueOnce({});

    await expect(updatePost('post-123', '新しい内容')).resolves.not.toThrow();

    // prisma.post.update が正しく呼び出されたことを検証
    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { id: 'post-123' },
      data: { content: '新しい内容' },
    });
  });
});
