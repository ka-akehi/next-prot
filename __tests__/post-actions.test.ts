import { createPost } from '@/view_model/post/post-actions';

global.fetch = jest.fn(); // or jest.fn()

describe('createPost', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('正常に投稿を作成できる', async () => {
    const mockPost = { id: '1', content: 'テスト投稿', userId: 'user-123' };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPost,
    });

    const result = await createPost({
      content: 'テスト投稿',
      userId: 'user-123',
    });

    expect(result).toEqual(mockPost);
  });

  it('投稿失敗時に例外をスローする', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    await expect(createPost({ content: '失敗投稿', userId: 'user-123' })).rejects.toThrow('投稿に失敗しました');
  });
});
