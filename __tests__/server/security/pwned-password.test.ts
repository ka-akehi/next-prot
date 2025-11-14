import { describe, expect, it, jest } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };
const originalFetch = global.fetch;

function setupEnv(overrides: Record<string, string>): void {
  process.env = { ...ORIGINAL_ENV, ...overrides };
}

function mockFetchResponse(body: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  } as Response;
}

describe('pwned-password ヘルパー', () => {
  let warnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    jest.resetModules();
    setupEnv({
      PWNED_PASSWORD_VALIDATION_ENABLED: 'true',
      PWNED_PASSWORD_MAX_COUNT: '2',
      PWNED_PASSWORD_TIMEOUT_MS: '50',
      PWNED_PASSWORD_MAX_RETRIES: '1',
      PWNED_PASSWORD_RETRY_DELAY_MS: '0',
    });
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    global.fetch = originalFetch;
    warnSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('hashPasswordToSha1 が大文字の SHA-1 ハッシュを返す', async () => {
    const { hashPasswordToSha1 } = await import('@/server/security/pwned-password');
    expect(hashPasswordToSha1('password')).toBe('5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8');
  });

  it('checkPwnedPassword が閾値を超えたパスワードを検知する', async () => {
    const { hashPasswordToSha1, checkPwnedPassword } = await import('@/server/security/pwned-password');
    const targetPassword = 'very-weak-password';
    const sha1 = hashPasswordToSha1(targetPassword);
    const suffix = sha1.slice(5);
    const body = `${suffix}:10\nOTHER_SUFFIX:1`;

    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(mockFetchResponse(body));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await checkPwnedPassword(targetPassword);

    expect(result).toEqual({ compromised: true, count: 10 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(sha1.slice(0, 5));
  });

  it('checkPwnedPassword が API エラー時にフェイルクローズする', async () => {
    const { checkPwnedPassword } = await import('@/server/security/pwned-password');
    const fetchMock = jest.fn<typeof fetch>().mockRejectedValue(new Error('network'));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await checkPwnedPassword('any-password');

    expect(result.compromised).toBe(true);
    expect(result.count).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('checkPwnedPassword が HTTP エラーも危険と判断する', async () => {
    const { checkPwnedPassword } = await import('@/server/security/pwned-password');
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(mockFetchResponse('', 500));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await checkPwnedPassword('another-password');

    expect(result.compromised).toBe(true);
    expect(result.count).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('checkPwnedPassword がレスポンスに存在しないパスワードを許可する', async () => {
    const { hashPasswordToSha1, checkPwnedPassword } = await import('@/server/security/pwned-password');
    const password = 'unique-password';
    const sha1 = hashPasswordToSha1(password);
    const body = `AAAAA000000000000000000000000000000:1\nBBBBB11111111111111111111111111111:2`;

    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(mockFetchResponse(body));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await checkPwnedPassword(password);

    expect(result).toEqual({ compromised: false, count: 1 });
  });
});
