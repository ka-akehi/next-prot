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

  const penaltyActive = penaltyTtlRaw > 0;
  const penaltyTargetSeconds = penaltyActive ? computePenaltyTargetSeconds(config.penaltyTtlSeconds) : 0;
  const lockTarget = penaltyActive ? Math.min(config.maxWindowSeconds, penaltyTargetSeconds) : 0;

  if (penaltyActive) {
    await ensurePenaltyTtl(client, penaltyKey, penaltyTargetSeconds);
  }

  const ensuredLock = penaltyActive
    ? await ensureLockTtl(client, lockKey, lockTarget, true)
    : Math.max(0, currentLockTtlRaw);

  const retryAfterSeconds = penaltyActive ? (ensuredLock > 0 ? ensuredLock : lockTarget) : ensuredLock;
  const effectiveFailures = penaltyActive ? Math.max(consecutiveFailures, config.threshold + 1) : consecutiveFailures;

  return buildResult(config, effectiveFailures, retryAfterSeconds);
}

export async function recordAccountFailure(identifier: string): Promise<AccountRateLimitResult> {
  const { normalizedIdentifier, client, config } = await setupRateLimiter(identifier);

  const failuresKey = buildFailuresKey(normalizedIdentifier);
  const lockKey = buildLockKey(normalizedIdentifier);
  const penaltyKey = buildPenaltyKey(normalizedIdentifier);

  const penaltyTtlBefore = await client.ttl(penaltyKey);
  const penaltyTargetSeconds = computePenaltyTargetSeconds(config.penaltyTtlSeconds);

  const now = Date.now();
  const windowMs = config.baseWindowSeconds * 1000;
  const retentionSeconds = Math.max(config.baseWindowSeconds, config.maxWindowSeconds);

  await client.zRemRangeByScore(failuresKey, 0, now - windowMs);
  await client.zAdd(failuresKey, [{ score: now, value: `${now}:${randomSuffix()}` }]);
  await client.expire(failuresKey, retentionSeconds);

  const consecutiveFailures = await client.zCard(failuresKey);

  const wasPenaltyActive = penaltyTtlBefore > 0;
  let lockTtl = wasPenaltyActive
    ? await ensureLockTtl(client, lockKey, Math.min(config.maxWindowSeconds, penaltyTargetSeconds), true)
    : 0;

  if (wasPenaltyActive) {
    await ensurePenaltyTtl(client, penaltyKey, penaltyTargetSeconds);
  }

  if (consecutiveFailures > config.threshold) {
    const calculatedBackoff = calculateBackoffSeconds(consecutiveFailures, config);
    lockTtl = Math.max(lockTtl, await ensureLockTtl(client, lockKey, calculatedBackoff));

    if (calculatedBackoff >= config.maxWindowSeconds) {
      await ensurePenaltyTtl(client, penaltyKey, penaltyTargetSeconds);
      lockTtl = Math.max(
        lockTtl,
        await ensureLockTtl(client, lockKey, Math.min(config.maxWindowSeconds, penaltyTargetSeconds), true)
      );
    }
  }

  const penaltyActive = wasPenaltyActive || (await client.ttl(penaltyKey)) > 0;

  if (penaltyActive) {
    await ensurePenaltyTtl(client, penaltyKey, penaltyTargetSeconds);
    lockTtl = Math.max(
      lockTtl,
      await ensureLockTtl(client, lockKey, Math.min(config.maxWindowSeconds, penaltyTargetSeconds), true)
    );
  }

  const effectiveFailures = penaltyActive ? config.threshold + 1 : consecutiveFailures;

  return buildResult(config, effectiveFailures, lockTtl);
}

export async function resetAccountRateLimit(identifier: string): Promise<void> {
  const { normalizedIdentifier, client } = await setupRateLimiter(identifier);

  await Promise.all([
    client.del(buildFailuresKey(normalizedIdentifier)),
    client.del(buildLockKey(normalizedIdentifier)),
    client.del(buildPenaltyKey(normalizedIdentifier)),
  ]);
}
