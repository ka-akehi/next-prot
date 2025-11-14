import { verifyPasswordOrThrow } from '@/helpers/auth.helpers';
import type { RateLimitedError } from '@/helpers/auth/rate-limit';
import { AUTH_ERROR_CODES } from '@domain/auth/auth.errors';
import { describe, expect, it, jest } from '@jest/globals';
import type { User } from '@prisma/client';

jest.mock('@/helpers/auth/rate-limit', () => {
  const actual = jest.requireActual<typeof import('@/helpers/auth/rate-limit')>('@/helpers/auth/rate-limit');

  return {
    ...actual,
    createRateLimitPipeline: jest.fn(),
    recordRateLimitFailure: jest.fn(),
    resetRateLimitState: jest.fn(),
    buildLogContext: jest.fn(actual.buildLogContext),
  };
});

jest.mock('@/helpers/auth/password', () => ({
  verifyPassword: jest.fn(),
  resetLoginState: jest.fn(),
}));

import { resetLoginState, verifyPassword } from '@/helpers/auth/password';
import {
  buildLogContext,
  createRateLimitPipeline,
  recordRateLimitFailure,
  resetRateLimitState,
  type AccountRateLimitLogContext,
  type RateLimitPipeline,
} from '@/helpers/auth/rate-limit';

const createRateLimitPipelineMock = createRateLimitPipeline as jest.MockedFunction<typeof createRateLimitPipeline>;
const recordRateLimitFailureMock = recordRateLimitFailure as jest.MockedFunction<typeof recordRateLimitFailure>;
const resetRateLimitStateMock = resetRateLimitState as jest.MockedFunction<typeof resetRateLimitState>;
const buildLogContextMock = buildLogContext as jest.MockedFunction<typeof buildLogContext>;
const verifyPasswordMock = verifyPassword as jest.MockedFunction<typeof verifyPassword>;
const resetLoginStateMock = resetLoginState as jest.MockedFunction<typeof resetLoginState>;

const baseUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  emailVerified: null,
  passwordHash: 'hash',
  loginAttempts: 0,
  lockedUntil: null,
  name: 'User',
  image: null,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  lastTwoFactorAt: null,
  passwordSetupToken: null,
  passwordSetupTokenExpires: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

const allowContext: AccountRateLimitLogContext = {
  action: 'enforce',
  identifier: 'user@example.com',
  result: {
    allowed: true,
    consecutiveFailures: 0,
    remaining: 5,
    retryAfterSeconds: 0,
    threshold: 5,
  },
};

describe('verifyPasswordOrThrow 関数', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createRateLimitPipelineMock.mockResolvedValue({
      identifier: allowContext.identifier,
      redisAvailable: true,
      fallbackActive: false,
      enforceContext: allowContext,
    } satisfies RateLimitPipeline);
    recordRateLimitFailureMock.mockResolvedValue({
      action: 'record',
      identifier: allowContext.identifier,
      result: {
        ...allowContext.result,
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 60,
      },
    });
    resetRateLimitStateMock.mockResolvedValue(undefined);
    verifyPasswordMock.mockResolvedValue(baseUser);
    resetLoginStateMock.mockResolvedValue(baseUser);
  });

  it('レート制限で拒否された場合は例外を送出する', async () => {
    const denyContext: AccountRateLimitLogContext = {
      ...allowContext,
      result: { ...allowContext.result, allowed: false, retryAfterSeconds: 120, remaining: 0 },
    };

    createRateLimitPipelineMock
      .mockResolvedValueOnce({
        identifier: denyContext.identifier,
        redisAvailable: true,
        fallbackActive: false,
        enforceContext: denyContext,
      })
      .mockReturnValueOnce(
        Promise.resolve({
          identifier: denyContext.identifier,
          redisAvailable: true,
          fallbackActive: false,
          enforceContext: denyContext,
        })
      );

    const pipeline = await createRateLimitPipelineMock(denyContext.identifier);

    recordRateLimitFailureMock.mockResolvedValueOnce({
      action: 'record',
      identifier: denyContext.identifier,
      result: { ...denyContext.result },
    });

    await expect(verifyPasswordOrThrow({ ...baseUser }, 'password', pipeline)).rejects.toMatchObject({
      message: AUTH_ERROR_CODES.TooManyRequestsShortWait,
      accountRateLimit: {
        action: 'record',
        identifier: denyContext.identifier,
        result: { ...denyContext.result },
      },
    });
    expect(verifyPasswordMock).not.toHaveBeenCalled();
    expect(recordRateLimitFailureMock).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: denyContext.identifier })
    );
    expect(resetRateLimitStateMock).not.toHaveBeenCalled();
  });

  it('パスワード検証で発生したエラーを伝播する', async () => {
    const rateLimitContext: AccountRateLimitLogContext = {
      ...allowContext,
      action: 'record',
      result: { ...allowContext.result, allowed: false, remaining: 0, retryAfterSeconds: 300 },
    };

    createRateLimitPipelineMock
      .mockResolvedValueOnce({
        identifier: rateLimitContext.identifier,
        redisAvailable: true,
        fallbackActive: false,
        enforceContext: rateLimitContext,
      })
      .mockReturnValueOnce(
        Promise.resolve({
          identifier: rateLimitContext.identifier,
          redisAvailable: true,
          fallbackActive: false,
          enforceContext: rateLimitContext,
        })
      );

    const pipeline = await createRateLimitPipelineMock(rateLimitContext.identifier);

    recordRateLimitFailureMock.mockResolvedValueOnce({
      action: 'record',
      identifier: rateLimitContext.identifier,
      result: { ...rateLimitContext.result },
    });

    verifyPasswordMock.mockImplementationOnce(async () => {
      const error = new Error(AUTH_ERROR_CODES.TooManyRequestsShortWait) as RateLimitedError;
      error.accountRateLimit = rateLimitContext;
      throw error;
    });

    await expect(verifyPasswordOrThrow({ ...baseUser }, 'password', pipeline)).rejects.toMatchObject({
      message: AUTH_ERROR_CODES.TooManyRequestsShortWait,
      accountRateLimit: rateLimitContext,
    });
    expect(resetRateLimitStateMock).not.toHaveBeenCalled();
  });

  it('成功時には整形済みユーザーとリセット結果を返す', async () => {
    const updatedUser = { ...baseUser, loginAttempts: 1 };
    verifyPasswordMock.mockReset().mockResolvedValueOnce(updatedUser);
    resetLoginStateMock.mockResolvedValueOnce({ ...updatedUser, loginAttempts: 0 });

    const resetContext: AccountRateLimitLogContext = {
      action: 'reset',
      identifier: allowContext.identifier,
      result: { ...allowContext.result },
    };
    resetRateLimitStateMock.mockResolvedValueOnce(resetContext);

    createRateLimitPipelineMock
      .mockReset()
      .mockResolvedValueOnce({
        identifier: resetContext.identifier,
        redisAvailable: true,
        fallbackActive: false,
        enforceContext: resetContext,
      })
      .mockReturnValueOnce(
        Promise.resolve({
          identifier: resetContext.identifier,
          redisAvailable: true,
          fallbackActive: false,
          enforceContext: resetContext,
        })
      );

    const pipeline = await createRateLimitPipelineMock(resetContext.identifier);
    const result = await verifyPasswordOrThrow({ ...baseUser }, 'password', pipeline);

    expect(result.user.loginAttempts).toBe(0);
    expect(result.accountRateLimit).toBe(resetContext);
    expect(createRateLimitPipelineMock).toHaveBeenCalledWith(allowContext.identifier);
    expect(resetRateLimitStateMock).toHaveBeenCalled();
  });

  it('リセット結果が未定義のときは enforce コンテキストを使う', async () => {
    resetRateLimitStateMock.mockReset().mockResolvedValueOnce(undefined);

    createRateLimitPipelineMock
      .mockReset()
      .mockResolvedValueOnce({
        identifier: allowContext.identifier,
        redisAvailable: true,
        fallbackActive: false,
        enforceContext: allowContext,
      })
      .mockReturnValueOnce(
        Promise.resolve({
          identifier: allowContext.identifier,
          redisAvailable: true,
          fallbackActive: false,
          enforceContext: allowContext,
        })
      );

    const pipeline = await createRateLimitPipelineMock(allowContext.identifier);

    const result = await verifyPasswordOrThrow({ ...baseUser }, 'password', pipeline);

    expect(result.accountRateLimit).toEqual(allowContext);
  });
});

describe('buildLogContext 関数', () => {
  it('accountRateLimit が指定された場合はログに含める', () => {
    const context = {
      action: 'enforce',
      identifier: 'id',
      result: allowContext.result,
    } satisfies AccountRateLimitLogContext;
    const log = buildLogContext(context);
    expect(log).toMatchObject({ provider: 'credentials', accountRateLimit: context });
    expect(buildLogContextMock).toHaveBeenCalledWith(context);
  });

  it('accountRateLimit が未定義の場合はログから省略する', () => {
    const log = buildLogContext(undefined);
    expect(log).toEqual({ provider: 'credentials' });
  });
});
