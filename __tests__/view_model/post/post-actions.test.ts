import * as postRepository from '@/repositories/posts/post.repository';
import { createPost, deletePost, updatePost } from '@/view_model/post/post-actions';
import { GENERAL_ERROR_MESSAGES, POST_ERROR_MESSAGES } from '@domain/messages/error.messages';
import { getAuthSession } from '@infrastructure/auth/auth';
import { describe, expect, it } from '@jest/globals';

global.fetch = jest.fn(); // or jest.fn()

jest.mock('@infrastructure/auth/auth', () => ({
  getAuthSession: jest.fn(),
}));

jest.mock('@/repositories/posts/post.repository', () => ({
  createPost: jest.fn(),
  deletePostById: jest.fn(),
  updatePost: jest.fn(),
  findPost: jest.fn(),
}));

const mockedPostRepository = postRepository as jest.Mocked<typeof postRepository>;

const mockPost = {
  id: '1',
  content: 'テスト投稿',
  userId: 'user-123',
  createdAt: new Date(),
  user: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: null,
    image: null,
    passwordHash: 'hash',
    createdAt: new Date(),
    twoFactorSecret: null,
    passwordSetupToken: null,
    passwordSetupTokenExpires: null,
    twoFactorEnabled: false,
    lastTwoFactorAt: null,
    loginAttempts: 0,
    lockedUntil: null,
  },
};

describe('createPost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常に投稿を作成できる', async () => {
    mockedPostRepository.createPost.mockResolvedValueOnce(mockPost);

    const result = await createPost({
      content: 'テスト投稿',
      userId: 'user-123',
    });

    // 結果を検証
    expect(result).toEqual(mockPost);

    // repository が正しく呼び出されたことを検証
    expect(mockedPostRepository.createPost).toHaveBeenCalledWith({
      content: 'テスト投稿',
      user: { connect: { id: 'user-123' } },
    });
  });

  it('投稿失敗時に例外をスローする', async () => {
    mockedPostRepository.createPost.mockRejectedValueOnce(new Error('DBエラー'));

    await expect(createPost({ content: '失敗投稿', userId: 'user-123' })).rejects.toThrow(
      POST_ERROR_MESSAGES.createFailed
    );

    expect(mockedPostRepository.createPost).toHaveBeenCalledWith({
      content: '失敗投稿',
      user: { connect: { id: 'user-123' } },
    });
  });
});

describe('deletePostById', () => {
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

    mockedPostRepository.findPost.mockResolvedValueOnce(mockPost);

    await expect(deletePost('post-123')).rejects.toThrow(POST_ERROR_MESSAGES.deleteUnauthorized);
  });

  it('正常に投稿を削除できる', async () => {
    // getAuthSession をログイン済みユーザーにモック
    (getAuthSession as jest.Mock).mockResolvedValueOnce({
      user: { id: 'user-123' },
    });

    mockedPostRepository.findPost.mockResolvedValueOnce(mockPost);
    mockedPostRepository.deletePostById.mockResolvedValueOnce(mockPost);

    await expect(deletePost('post-123')).resolves.not.toThrow();

    expect(mockedPostRepository.deletePostById).toHaveBeenCalledWith('post-123');
  });
});

describe('updatePost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ログインしていない場合に例外をスローする', async () => {
    // getAuthSession を未ログイン状態にモック
    (getAuthSession as jest.Mock).mockResolvedValueOnce(null);

    await expect(updatePost('post-123', '新しい内容')).rejects.toThrow(GENERAL_ERROR_MESSAGES.authRequired);
  });

  it('編集権限がない場合に例外をスローする', async () => {
    // getAuthSession を別ユーザーのセッションにモック
    (getAuthSession as jest.Mock).mockResolvedValueOnce({
      user: { id: 'user-456' },
    });

    mockedPostRepository.findPost.mockResolvedValueOnce(mockPost);

    await expect(updatePost('post-123', '新しい内容')).rejects.toThrow(POST_ERROR_MESSAGES.updateUnauthorized);
  });

  it('正常に投稿を更新できる', async () => {
    // getAuthSession をログイン済みユーザーにモック
    (getAuthSession as jest.Mock).mockResolvedValueOnce({
      user: { id: 'user-123' },
    });

    mockedPostRepository.findPost.mockResolvedValueOnce(mockPost);
    mockedPostRepository.updatePost.mockResolvedValueOnce(mockPost);

    await expect(updatePost('post-123', '新しい内容')).resolves.not.toThrow();

    expect(mockedPostRepository.updatePost).toHaveBeenCalledWith('post-123', { content: '新しい内容' });
  });
});
