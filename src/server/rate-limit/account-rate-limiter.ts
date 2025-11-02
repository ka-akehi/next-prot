import {
  buildFailuresKey,
  buildLockKey,
  buildPenaltyKey,
  buildResult,
  calculateBackoffSeconds,
  computePenaltyTargetSeconds,
  ensureLockTtl,
  ensurePenaltyTtl,
  getRecentFailureCount,
  randomSuffix,
  setupRateLimiter,
  type AccountRateLimitResult,
} from './account-rate-limiter-helpers';

export { calculateBackoffSeconds } from './account-rate-limiter-helpers';
export type { AccountRateLimitResult } from './account-rate-limiter-helpers';

export async function enforceAccountRateLimit(identifier: string): Promise<AccountRateLimitResult> {
  const { normalizedIdentifier, client, config } = await setupRateLimiter(identifier);

  const lockKey = buildLockKey(normalizedIdentifier);
  const penaltyKey = buildPenaltyKey(normalizedIdentifier);

  const [currentLockTtlRaw, penaltyTtlRaw, consecutiveFailures] = await Promise.all([
    client.ttl(lockKey),
    client.ttl(penaltyKey),
    getRecentFailureCount(client, normalizedIdentifier, config.maxWindowSeconds),
  ]);

  const lockActive = currentLockTtlRaw > 0;
  const penaltyActive = penaltyTtlRaw > 0;
  let lockTtl = lockActive ? currentLockTtlRaw : 0;

  if (penaltyActive) {
    const penaltyTargetSeconds = computePenaltyTargetSeconds(config.penaltyTtlSeconds);
    await ensurePenaltyTtl(client, penaltyKey, penaltyTargetSeconds, { allowIncrease: false });

    if (lockActive) {
      lockTtl = await ensureLockTtl(client, lockKey, config.maxWindowSeconds, true);
    }
  }

  return buildResult(config, consecutiveFailures, lockTtl);
}

export async function recordAccountFailure(identifier: string): Promise<AccountRateLimitResult> {
  const { normalizedIdentifier, client, config } = await setupRateLimiter(identifier);

  const failuresKey = buildFailuresKey(normalizedIdentifier);
  const lockKey = buildLockKey(normalizedIdentifier);
  const penaltyKey = buildPenaltyKey(normalizedIdentifier);

  const [penaltyTtlBefore, lockTtlBeforeRaw] = await Promise.all([client.ttl(penaltyKey), client.ttl(lockKey)]);
  const penaltyTargetSeconds = computePenaltyTargetSeconds(config.penaltyTtlSeconds);

  const now = Date.now();
  const windowMs = config.baseWindowSeconds * 1000;
  const retentionSeconds = Math.max(config.baseWindowSeconds, config.maxWindowSeconds);

  await client.zRemRangeByScore(failuresKey, 0, now - windowMs);
  await client.zAdd(failuresKey, [{ score: now, value: `${now}:${randomSuffix()}` }]);
  await client.expire(failuresKey, retentionSeconds);

  const consecutiveFailures = await client.zCard(failuresKey);

  const wasPenaltyActive = penaltyTtlBefore > 0;
  const wasLockActive = lockTtlBeforeRaw > 0;
  let lockTtl = wasLockActive ? lockTtlBeforeRaw : 0;

  if (wasPenaltyActive) {
    lockTtl = await ensureLockTtl(client, lockKey, config.maxWindowSeconds, true);
    await ensurePenaltyTtl(client, penaltyKey, penaltyTargetSeconds, { allowIncrease: false });
  } else if (consecutiveFailures > config.threshold) {
    const calculatedBackoff = calculateBackoffSeconds(consecutiveFailures, config);
    const overMaxWindow = calculatedBackoff >= config.maxWindowSeconds;
    const setLockTtlSeconds = overMaxWindow ? config.maxWindowSeconds : calculatedBackoff;
    lockTtl = await ensureLockTtl(client, lockKey, setLockTtlSeconds);

    if (overMaxWindow) {
      await ensurePenaltyTtl(client, penaltyKey, penaltyTargetSeconds);
    }
  }

  return buildResult(config, consecutiveFailures, lockTtl);
}

export async function resetAccountRateLimit(identifier: string): Promise<void> {
  const { normalizedIdentifier, client } = await setupRateLimiter(identifier);

  await Promise.all([
    client.del(buildFailuresKey(normalizedIdentifier)),
    client.del(buildLockKey(normalizedIdentifier)),
    client.del(buildPenaltyKey(normalizedIdentifier)),
  ]);
}
