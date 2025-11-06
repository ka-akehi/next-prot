import { buildLogContext, verifyPasswordOrThrow } from '@/helpers/auth.helpers';
import type { AccountRateLimitLogContext, RateLimitPipeline, RateLimitedError } from '@/helpers/auth/rate-limit';
import { AUTH_ERROR_CODES } from '@domain/auth/auth.errors';
import { describe, expect, it, jest } from '@jest/globals';
import type { User } from '@prisma/client';

jest.mock('@/helpers/auth/rate-limit', () => {
  const actual = jest.requireActual<typeof import('@/helpers/auth/rate-limit')>('@/helpers/auth/rate-limit');

  return {
    ...actual,
    createRateLimitPipeline: jest.fn(),
    ensureRateLimitAllowed: jest.fn(),
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
  buildLogContext as buildLogContextImpl,
  createRateLimitPipeline,
  ensureRateLimitAllowed,
  resetRateLimitState,
} from '@/helpers/auth/rate-limit';

const createRateLimitPipelineMock = createRateLimitPipeline as jest.MockedFunction<typeof createRateLimitPipeline>;
const ensureRateLimitAllowedMock = ensureRateLimitAllowed as jest.MockedFunction<typeof ensureRateLimitAllowed>;
const resetRateLimitStateMock = resetRateLimitState as jest.MockedFunction<typeof resetRateLimitState>;
const buildLogContextMock = buildLogContextImpl as jest.MockedFunction<typeof buildLogContextImpl>;
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

describe('verifyPasswordOrThrow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createRateLimitPipelineMock.mockResolvedValue({
      identifier: allowContext.identifier,
      redisAvailable: true,
      fallbackActive: false,
      enforceContext: allowContext,
    } satisfies RateLimitPipeline);
    resetRateLimitStateMock.mockResolvedValue(undefined);
    verifyPasswordMock.mockResolvedValue(baseUser);
    resetLoginStateMock.mockResolvedValue(baseUser);
  });

  it('throws when rate limit denies the attempt', async () => {
    const denyContext: AccountRateLimitLogContext = {
      ...allowContext,
      result: { ...allowContext.result, allowed: false, retryAfterSeconds: 120, remaining: 0 },
    };

    createRateLimitPipelineMock.mockResolvedValueOnce({
      identifier: denyContext.identifier,
      redisAvailable: true,
      fallbackActive: false,
      enforceContext: denyContext,
    });

    ensureRateLimitAllowedMock.mockImplementationOnce(() => {
      const error = new Error(AUTH_ERROR_CODES.TooManyRequests) as RateLimitedError;
      error.accountRateLimit = denyContext;
      throw error;
    });

    await expect(verifyPasswordOrThrow({ ...baseUser }, 'password')).rejects.toMatchObject({
      message: AUTH_ERROR_CODES.TooManyRequests,
      accountRateLimit: denyContext,
    });
    expect(verifyPasswordMock).not.toHaveBeenCalled();
  });

  it('propagates password verification errors', async () => {
    const rateLimitContext: AccountRateLimitLogContext = {
      ...allowContext,
      action: 'record',
      result: { ...allowContext.result, allowed: false, remaining: 0, retryAfterSeconds: 300 },
    };

    verifyPasswordMock.mockImplementationOnce(async () => {
      const error = new Error(AUTH_ERROR_CODES.TooManyRequests) as RateLimitedError;
      error.accountRateLimit = rateLimitContext;
      throw error;
    });

    await expect(verifyPasswordOrThrow({ ...baseUser }, 'password')).rejects.toMatchObject({
      message: AUTH_ERROR_CODES.TooManyRequests,
      accountRateLimit: rateLimitContext,
    });
    expect(resetRateLimitStateMock).not.toHaveBeenCalled();
  });

  it('returns sanitized user and reset context on success', async () => {
    const updatedUser = { ...baseUser, loginAttempts: 1 };
    verifyPasswordMock.mockResolvedValueOnce(updatedUser);
    resetLoginStateMock.mockResolvedValueOnce({ ...updatedUser, loginAttempts: 0 });

    const resetContext: AccountRateLimitLogContext = {
      action: 'reset',
      identifier: allowContext.identifier,
      result: { ...allowContext.result },
    };
    resetRateLimitStateMock.mockResolvedValueOnce(resetContext);

    const result = await verifyPasswordOrThrow({ ...baseUser }, 'password');

    expect(result.user.loginAttempts).toBe(0);
    expect(result.accountRateLimit).toBe(resetContext);
    expect(createRateLimitPipelineMock).toHaveBeenCalledWith(allowContext.identifier);
    expect(ensureRateLimitAllowedMock).toHaveBeenCalled();
    expect(resetRateLimitStateMock).toHaveBeenCalled();
  });

  it('falls back to enforce context when reset returns undefined', async () => {
    resetRateLimitStateMock.mockResolvedValueOnce(undefined);

    const result = await verifyPasswordOrThrow({ ...baseUser }, 'password');

    expect(result.accountRateLimit).toEqual(allowContext);
  });
});

describe('buildLogContext', () => {
  it('adds accountRateLimit when provided', () => {
    const context = {
      action: 'enforce',
      identifier: 'id',
      result: allowContext.result,
    } satisfies AccountRateLimitLogContext;
    const log = buildLogContext(context);
    expect(log).toMatchObject({ provider: 'credentials', accountRateLimit: context });
    expect(buildLogContextMock).toHaveBeenCalledWith(context);
  });

  it('omits accountRateLimit when undefined', () => {
    const log = buildLogContext(undefined);
    expect(log).toEqual({ provider: 'credentials' });
  });
});
