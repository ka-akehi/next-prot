import { getAccountRateLimitConfig, type AccountRateLimitConfig } from '@/server/config/account-rate-limit.config';
import {
  buildResult,
  calculateBackoffSeconds,
  normalizeIdentifier,
} from '@/server/rate-limit/account-rate-limiter-helpers';
import type { AccountRateLimitResult } from '@/server/rate-limit/account-rate-limiter';

type LocalRateLimitState = {
  failures: number[];
  lockUntil?: number;
};

const FALLBACK_STATE = new Map<string, LocalRateLimitState>();

export function enforceLocalAccountRateLimit(identifier: string): AccountRateLimitResult {
  const config = getAccountRateLimitConfig();
  const { key, state } = ensureState(identifier, config);
  const now = Date.now();

  pruneFailures(state, now, config.maxWindowSeconds * 1000);

  const lockActive = state.lockUntil && state.lockUntil > now;
  if (!lockActive) {
    state.lockUntil = undefined;
  }

  const retryAfterSeconds = lockActive ? Math.max(Math.ceil((state.lockUntil! - now) / 1000), 1) : 0;
  const result = buildResult(config, state.failures.length, retryAfterSeconds);
  updateState(key, state);
  return result;
}

export function recordLocalAccountFailure(identifier: string): AccountRateLimitResult {
  const config = getAccountRateLimitConfig();
  const { key, state } = ensureState(identifier, config);
  const now = Date.now();

  pruneFailures(state, now, config.maxWindowSeconds * 1000);
  state.failures.push(now);

  const consecutiveFailures = state.failures.length;
  const backoffSeconds = calculateBackoffSeconds(consecutiveFailures, config);

  if (backoffSeconds > 0) {
    const lockUntil = now + backoffSeconds * 1000;
    state.lockUntil = lockUntil;
  } else {
    state.lockUntil = undefined;
  }

  const retryAfterSeconds = state.lockUntil ? Math.max(Math.ceil((state.lockUntil - now) / 1000), 1) : 0;
  const result = buildResult(config, consecutiveFailures, retryAfterSeconds);
  updateState(key, state);
  return result;
}

export function resetLocalAccountRateLimit(identifier: string): void {
  const key = normalizeIdentifier(identifier);
  FALLBACK_STATE.delete(key);
}

export function resetAllLocalAccountRateLimits(): void {
  FALLBACK_STATE.clear();
}

function ensureState(identifier: string, config: AccountRateLimitConfig): {
  key: string;
  state: LocalRateLimitState;
} {
  const key = normalizeIdentifier(identifier);
  const state = FALLBACK_STATE.get(key) ?? { failures: [] };
  FALLBACK_STATE.set(key, state);
  pruneFailures(state, Date.now(), config.maxWindowSeconds * 1000);
  return { key, state };
}

function pruneFailures(state: LocalRateLimitState, now: number, windowMs: number): void {
  const windowStart = now - windowMs;
  state.failures = state.failures.filter((timestamp) => timestamp >= windowStart);
}

function updateState(key: string, state: LocalRateLimitState): void {
  FALLBACK_STATE.set(key, state);
}
