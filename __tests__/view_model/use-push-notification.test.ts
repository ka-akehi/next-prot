import { usePushNotification } from '@/view_model/usePushNotification';
import { describe, expect } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

const mockServiceWorkerReady = {
  pushManager: {
    getSubscription: jest.fn(),
    subscribe: jest.fn(),
  },
};

const mockSubscription = {
  unsubscribe: jest.fn(),
};

Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve(mockServiceWorkerReady),
  },
});

global.Notification = jest.fn().mockImplementation((title: string, options?: NotificationOptions) => ({
  title,
  options,
})) as unknown as {
  new (title: string, options?: NotificationOptions): Notification;
  prototype: Notification;
  readonly permission: NotificationPermission;
  requestPermission: (deprecatedCallback?: NotificationPermissionCallback) => Promise<NotificationPermission>;
};
Object.defineProperty(global.Notification, 'requestPermission', {
  value: jest.fn(),
  writable: true,
});
Object.defineProperty(global.Notification, 'permission', {
  value: 'default',
  writable: true,
});

global.fetch = jest.fn();

describe('usePushNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockServiceWorkerReady.pushManager.getSubscription as jest.Mock).mockResolvedValue(null);
    (mockServiceWorkerReady.pushManager.subscribe as jest.Mock).mockResolvedValue(mockSubscription);
    (mockSubscription.unsubscribe as jest.Mock).mockResolvedValue(undefined);
    (global.Notification.requestPermission as jest.Mock).mockResolvedValue('granted');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
  });

  it('初期状態でsubscribedがfalseであること', () => {
    const { result } = renderHook(() => usePushNotification());
    expect(result.current.subscribed).toBe(false);
  });

  it('サービスワーカーが購読済みの場合、subscribedがtrueになること', async () => {
    (mockServiceWorkerReady.pushManager.getSubscription as jest.Mock).mockResolvedValue(mockSubscription);

    const { result } = renderHook(() => usePushNotification());
    await waitFor(() => expect(result.current.subscribed).toBe(true));

    expect(result.current.subscribed).toBe(true);
  });

  it('subscribeを呼び出すと購読が成功し、subscribedがtrueになること', async () => {
    const { result } = renderHook(() => usePushNotification());

    await act(async () => {
      await result.current.toggle();
    });

    expect(global.Notification.requestPermission).toHaveBeenCalled();
    expect(mockServiceWorkerReady.pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/pushNotice', {
      method: 'POST',
      body: JSON.stringify(mockSubscription),
    });
    expect(result.current.subscribed).toBe(true);
  });

  it('unsubscribeを呼び出すと購読解除が成功し、subscribedがfalseになること', async () => {
    (mockServiceWorkerReady.pushManager.getSubscription as jest.Mock).mockResolvedValue(mockSubscription);

    const { result } = renderHook(() => usePushNotification());

    await act(async () => {
      result.current.toggle();
    });

    await waitFor(() => expect(result.current.subscribed).toBe(true));

    await act(async () => {
      result.current.toggle();
    });

    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('/api/pushNotice', {
      method: 'DELETE',
      body: JSON.stringify(mockSubscription),
    });
    expect(result.current.subscribed).toBe(false);
  });

  it('通知の許可が拒否された場合、購読が行われないこと', async () => {
    (global.Notification.requestPermission as jest.Mock).mockResolvedValue('denied');

    const { result } = renderHook(() => usePushNotification());

    await act(async () => {
      await result.current.toggle();
    });

    expect(global.Notification.requestPermission).toHaveBeenCalled();
    expect(mockServiceWorkerReady.pushManager.subscribe).not.toHaveBeenCalled();
    expect(result.current.subscribed).toBe(false);
  });
});
