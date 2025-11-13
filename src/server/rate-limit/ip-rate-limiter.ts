import { ensureRedisConnection } from '@/server/redis';
import { getEnvNumber } from '@/shared/env';

const DEFAULT_MAX_ATTEMPTS = 100;
const DEFAULT_WINDOW_SECONDS = 60;
const MAX_ATTEMPTS = getEnvNumber('IP_RATE_LIMIT_MAX_ATTEMPTS', DEFAULT_MAX_ATTEMPTS);
const WINDOW_SECONDS = getEnvNumber('IP_RATE_LIMIT_WINDOW_SECONDS', DEFAULT_WINDOW_SECONDS);

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
};

export async function enforceIpRateLimit(ip: string): Promise<RateLimitResult> {
  const client = await ensureRedisConnection();
  const windowSeconds = WINDOW_SECONDS;
  const maxAttempts = MAX_ATTEMPTS;
  const redisKey = `rate:ip:${ip}`;

  const results = await client.multi().incr(redisKey).expire(redisKey, windowSeconds, 'NX').exec();

  const incrementResult = results?.[0];
  const currentCount = typeof incrementResult === 'number' ? incrementResult : Number(incrementResult ?? 0);

  let ttl = await client.ttl(redisKey);
  if (ttl < 0) {
    await client.expire(redisKey, windowSeconds);
    ttl = windowSeconds;
  }

  const allowed = currentCount <= maxAttempts;
  const retryAfterSeconds = allowed ? 0 : Math.max(ttl, 1);

  return {
    allowed,
    remaining: Math.max(maxAttempts - currentCount, 0),
    retryAfterSeconds,
    limit: maxAttempts,
  };
}
