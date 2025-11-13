import { getEnvNumber } from '@/shared/env';

export type AccountRateLimitConfig = {
  threshold: number;
  baseWindowSeconds: number;
  maxWindowSeconds: number;
  historyWindowSeconds: number;
  penaltyTtlSeconds: number;
};

const DEFAULT_THRESHOLD = 5;
const DEFAULT_BASE_WINDOW_SECONDS = 30;
const DEFAULT_MAX_WINDOW_SECONDS = 3600;
const DEFAULT_HISTORY_WINDOW_SECONDS = 60 * 60 * 24; // 24 hours
const DEFAULT_PENALTY_TTL_SECONDS = 60 * 60 * 12; // 12 hours

let cachedConfig: AccountRateLimitConfig | null = null;

export function getAccountRateLimitConfig(): AccountRateLimitConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const threshold = readPositiveInteger('ACCOUNT_RATE_LIMIT_THRESHOLD', DEFAULT_THRESHOLD);
  const baseWindowSeconds = readPositiveInteger('ACCOUNT_RATE_LIMIT_BASE_WINDOW', DEFAULT_BASE_WINDOW_SECONDS);
  const maxWindowSeconds = readPositiveInteger('ACCOUNT_RATE_LIMIT_MAX_WINDOW', DEFAULT_MAX_WINDOW_SECONDS);
  const historyWindowSeconds = readPositiveInteger('ACCOUNT_RATE_LIMIT_HISTORY_WINDOW', DEFAULT_HISTORY_WINDOW_SECONDS);
  let penaltyTtlSeconds = readPositiveInteger('ACCOUNT_RATE_LIMIT_PENALTY_TTL', DEFAULT_PENALTY_TTL_SECONDS);

  if (maxWindowSeconds < baseWindowSeconds) {
    throw new Error('ACCOUNT_RATE_LIMIT_MAX_WINDOW must be greater than or equal to ACCOUNT_RATE_LIMIT_BASE_WINDOW');
  }

  if (historyWindowSeconds < maxWindowSeconds) {
    throw new Error('ACCOUNT_RATE_LIMIT_HISTORY_WINDOW must be greater than or equal to ACCOUNT_RATE_LIMIT_MAX_WINDOW');
  }

  if (penaltyTtlSeconds < maxWindowSeconds) {
    penaltyTtlSeconds = maxWindowSeconds;
  }

  cachedConfig = {
    threshold,
    baseWindowSeconds,
    maxWindowSeconds,
    historyWindowSeconds,
    penaltyTtlSeconds,
  };

  return cachedConfig;
}

function readPositiveInteger(envKey: string, defaultValue: number): number {
  const raw = getEnvNumber(envKey, defaultValue);
  const isPositiveInteger = Number.isInteger(raw) && raw > 0;
  const isFinite = Number.isFinite(raw);
  if (!isFinite || !isPositiveInteger) {
    throw new Error(`${envKey} must be a positive integer`);
  }

  return raw;
}
