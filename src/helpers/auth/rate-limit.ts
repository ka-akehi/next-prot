import { getAccountRateLimitConfig } from '@/server/config/account-rate-limit.config';
import type { AccountRateLimitResult } from '@/server/rate-limit/account-rate-limiter';
import {
  enforceAccountRateLimit,
  recordAccountFailure,
  resetAccountRateLimit,
} from '@/server/rate-limit/account-rate-limiter';
import {
  enforceLocalAccountRateLimit,
  recordLocalAccountFailure,
  resetLocalAccountRateLimit,
} from '@/server/rate-limit/account-rate-limiter-fallback';
import { AUTH_ERROR_CODES, type AuthErrorCode } from '@domain/auth/auth.errors';

export type AccountRateLimitLogContext = {
  action: 'enforce' | 'record' | 'reset';
  identifier: string;
  result: AccountRateLimitResult;
};

export type RateLimitedError = Error & {
  accountRateLimit?: AccountRateLimitLogContext;
};

export type RateLimitPipeline = {
  identifier: string;
  redisAvailable: boolean;
  fallbackActive: boolean;
  enforceContext?: AccountRateLimitLogContext;
};

export async function createRateLimitPipeline(identifier: string): Promise<RateLimitPipeline> {
  const pipeline: RateLimitPipeline = {
    identifier,
    redisAvailable: true,
    fallbackActive: false,
  };

  try {
    const result = await enforceAccountRateLimit(identifier);
    pipeline.enforceContext = { action: 'enforce', identifier, result };
  } catch (error) {
    console.error('[auth] failed to enforce account rate limit', error);
    pipeline.redisAvailable = false;
    pipeline.fallbackActive = true;
    const fallbackResult = enforceLocalAccountRateLimit(identifier);
    pipeline.enforceContext = { action: 'enforce', identifier, result: fallbackResult };
  }

  return pipeline;
}

export async function recordRateLimitFailure(pipeline: RateLimitPipeline): Promise<AccountRateLimitLogContext> {
  if (pipeline.redisAvailable) {
    try {
      const result = await recordAccountFailure(pipeline.identifier);
      return { action: 'record', identifier: pipeline.identifier, result };
    } catch (error) {
      console.error('[auth] failed to record account rate limit', error);
      pipeline.redisAvailable = false;
      pipeline.fallbackActive = true;
    }
  }

  if (!pipeline.fallbackActive) {
    pipeline.fallbackActive = true;
  }

  const fallbackResult = recordLocalAccountFailure(pipeline.identifier);
  return { action: 'record', identifier: pipeline.identifier, result: fallbackResult };
}

export async function resetRateLimitState(
  pipeline: RateLimitPipeline
): Promise<AccountRateLimitLogContext | undefined> {
  if (pipeline.redisAvailable) {
    try {
      await resetAccountRateLimit(pipeline.identifier);
      const base = pipeline.enforceContext?.result ?? createDefaultRateLimitResultForReset();
      return buildResetContext(pipeline.identifier, base);
    } catch (error) {
      console.error('[auth] failed to reset account rate limit', error);
      pipeline.redisAvailable = false;
      pipeline.fallbackActive = true;
    }
  }

  if (pipeline.fallbackActive) {
    resetLocalAccountRateLimit(pipeline.identifier);
    const base = createDefaultRateLimitResultForReset();
    return buildResetContext(pipeline.identifier, base);
  }

  return pipeline.enforceContext;
}

export function buildLogContext(
  accountRateLimitContext: AccountRateLimitLogContext | undefined
): Record<string, unknown> {
  const context: Record<string, unknown> = { provider: 'credentials' };
  if (accountRateLimitContext) {
    context.accountRateLimit = accountRateLimitContext;
  }

  return context;
}

export function resolveRateLimitErrorCode(retryAfterSeconds?: number): AuthErrorCode {
  if (!retryAfterSeconds || retryAfterSeconds < 1) {
    return AUTH_ERROR_CODES.TooManyRequests;
  }

  if (retryAfterSeconds <= 5 * 60) {
    return AUTH_ERROR_CODES.TooManyRequestsShortWait;
  }

  if (retryAfterSeconds < 60 * 60) {
    return AUTH_ERROR_CODES.TooManyRequestsMediumWait;
  }

  return AUTH_ERROR_CODES.TooManyRequestsExtendedWait;
}

function createDefaultRateLimitResultForReset(): AccountRateLimitResult {
  const config = getAccountRateLimitConfig();

  return {
    allowed: true,
    consecutiveFailures: 0,
    remaining: config.threshold,
    retryAfterSeconds: 0,
    threshold: config.threshold,
  };
}

function buildResetContext(identifier: string, base: AccountRateLimitResult): AccountRateLimitLogContext {
  return {
    action: 'reset',
    identifier,
    result: {
      ...base,
      allowed: true,
      consecutiveFailures: 0,
      remaining: base.threshold,
      retryAfterSeconds: 0,
    },
  };
}
