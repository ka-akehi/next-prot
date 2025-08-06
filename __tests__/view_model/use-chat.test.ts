import { useChat } from '@/view_model/use-chat';
import { act, renderHook } from '@testing-library/react';

describe('useChat', () => {
  let mockWebSocket: jest.Mocked<WebSocket>;

  beforeEach(() => {
    mockWebSocket = {
      send: jest.fn(),
      close: jest.fn(),
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
    } as unknown as jest.Mocked<WebSocket>;

    global.WebSocket = jest.fn(() => mockWebSocket) as unknown as jest.Mocked<typeof WebSocket>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('デフォルト値で初期化されること', () => {
    const { result } = renderHook(() => useChat('user1', 'room1'));

    expect(result.current.messages).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.input).toBe('');
  });

  it('WebSocketに接続し、接続時にjoinメッセージを送信できること', () => {
    renderHook(() => useChat('user1', 'room1'));

    expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:4000?room=room1');

    act(() => {
      mockWebSocket.onopen?.({} as Event);
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'join', user: 'user1' }));
  });

  it('カウントメッセージを受信した際にカウントを更新できること', () => {
    const { result } = renderHook(() => useChat('user1', 'room1'));

    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({ type: 'count', count: 5 }),
      } as MessageEvent);
    });

    expect(result.current.count).toBe(5);
  });

  it('メッセージを受信した際に、messagesに追加されること', () => {
    const { result } = renderHook(() => useChat('user1', 'room1'));

    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          type: 'chat',
          user: 'user2',
          content: 'Hello!',
          timestamp: '2023-01-01T00:00:00Z',
        }),
      } as MessageEvent);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      type: 'chat',
      user: 'user2',
      content: 'Hello!',
      timestamp: '2023-01-01T00:00:00Z',
    });
  });

  it('チャットメッセージを送信後、入力がリセットされること', () => {
    const { result } = renderHook(() => useChat('user1', 'room1'));

    act(() => {
      result.current.setInput('Test message');
    });

    act(() => {
      result.current.sendMessage();
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'chat',
        user: 'user1',
        content: 'Test message',
      })
    );
    expect(result.current.input).toBe('');
  });

  it('クリーンアップ時にWebSocketを閉じること', () => {
    const { unmount } = renderHook(() => useChat('user1', 'room1'));

    unmount();

    expect(mockWebSocket.close).toHaveBeenCalled();
  });
});
