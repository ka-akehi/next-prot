import { getAccountRateLimitConfig, type AccountRateLimitConfig } from '@/server/config/account-rate-limit.config';
import { ensureRedisConnection } from '@/server/redis';
import type { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

export type RateLimiterContext = {
  normalizedIdentifier: string;
  client: RedisClient;
  config: AccountRateLimitConfig;
};

export type AccountRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
  consecutiveFailures: number;
  threshold: number;
};

const FAILURE_KEY_PREFIX = 'rate:account:failures';
const LOCK_KEY_PREFIX = 'rate:account:lock';
const PENALTY_KEY_PREFIX = 'rate:account:penalty';

const LOCK_VALUE = 'locked';
const PENALTY_VALUE = 'penalty';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export async function setupRateLimiter(identifier: string): Promise<RateLimiterContext> {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const client = await ensureRedisConnection();
  const config = getAccountRateLimitConfig();

  return { normalizedIdentifier, client, config };
}

export function calculateBackoffSeconds(failures: number, config?: AccountRateLimitConfig): number {
  const { threshold, baseWindowSeconds, maxWindowSeconds } = config ?? getAccountRateLimitConfig();

  if (failures <= threshold) {
    return 0;
  }

  const exponent = failures - threshold;
  const waitSeconds = baseWindowSeconds * Math.pow(2, exponent - 1);

  return Math.min(waitSeconds, maxWindowSeconds);
}

export function buildResult(
  config: AccountRateLimitConfig,
  failures: number,
  retryAfterSeconds: number
): AccountRateLimitResult {
  const remaining = Math.max(config.threshold - failures, 0);
  const allowed = retryAfterSeconds < 1;

  return {
    allowed,
    retryAfterSeconds,
    remaining,
    consecutiveFailures: failures,
    threshold: config.threshold,
  };
}

export async function getRecentFailureCount(
  client: RedisClient,
  identifier: string,
  windowSeconds: number
): Promise<number> {
  const failuresKey = buildFailuresKey(identifier);
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  await client.zRemRangeByScore(failuresKey, 0, windowStart);
  const count = await client.zCard(failuresKey);

  if (count < 1) {
    await client.del(failuresKey);
  }

  return count;
}

export async function ensureLockTtl(
  client: RedisClient,
  lockKey: string,
  ttlSeconds: number,
  allowDecrease = false
): Promise<number> {
  const target = Math.max(0, ttlSeconds);
  const current = await client.ttl(lockKey);
  const currentPositive = current > 0 ? current : 0;

  if (target < 1) {
    if (allowDecrease) {
      await client.del(lockKey);
      return 0;
    }
    return currentPositive;
  }

  const isIncreasing = target > currentPositive;
  const isDecreasing = allowDecrease && target < currentPositive;
  const isZero = currentPositive === 0;
  if (isIncreasing || isDecreasing || isZero) {
    await client.set(lockKey, LOCK_VALUE, { EX: target });
    return target;
  }

  return currentPositive;
}

export async function ensurePenaltyTtl(
  client: RedisClient,
  penaltyKey: string,
  ttlSeconds: number,
  options?: { allowIncrease?: boolean }
): Promise<number> {
  const { allowIncrease = true } = options ?? {};
  const target = Math.max(0, ttlSeconds);

  if (target < 1) {
    await client.del(penaltyKey);
    return 0;
  }

  const current = await client.ttl(penaltyKey);
  const currentPositive = current > 0 ? current : 0;
  if (currentPositive === target) {
    return currentPositive;
  }

  const shouldUpdate = currentPositive === 0 || target < currentPositive;
  const canIncrease = allowIncrease && target > currentPositive;

  if (!shouldUpdate && !canIncrease) {
    return currentPositive;
  }

  await client.set(penaltyKey, PENALTY_VALUE, { EX: target });
  return target;
}

export function buildFailuresKey(identifier: string): string {
  return `${FAILURE_KEY_PREFIX}:${identifier}`;
}

export function buildLockKey(identifier: string): string {
  return `${LOCK_KEY_PREFIX}:${identifier}`;
}

export function buildPenaltyKey(identifier: string): string {
  return `${PENALTY_KEY_PREFIX}:${identifier}`;
}

export function normalizeIdentifier(identifier: string): string {
  const normalized = String(identifier ?? '').trim();

  if (!normalized) {
    throw new Error('Account rate limit identifier must be a non-empty string');
  }

  return normalized;
}

export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 12);
}

export function computePenaltyTargetSeconds(maxSeconds: number): number {
  const now = new Date();
  const secondsUntilMidnight = secondsUntilNextJstMidnight(now);
  return Math.min(secondsUntilMidnight, maxSeconds);
}

function secondsUntilNextJstMidnight(now: Date): number {
  const nowUtcMs = now.getTime();
  const jstMs = nowUtcMs + JST_OFFSET_MS;
  const jstDate = new Date(jstMs);

  const nextMidnightUtcMs =
    Date.UTC(jstDate.getUTCFullYear(), jstDate.getUTCMonth(), jstDate.getUTCDate() + 1, 0, 0, 0, 0) - JST_OFFSET_MS;

  const diffMs = nextMidnightUtcMs - nowUtcMs;
  if (diffMs <= 0) {
    return 1;
  }

  return Math.ceil(diffMs / 1000);
}
