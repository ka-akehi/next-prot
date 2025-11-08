import {
  AccountRateLimitLogContext,
  recordRateLimitFailure,
  resolveRateLimitErrorCode,
  type RateLimitedError,
  type RateLimitPipeline,
} from '@/helpers/auth/rate-limit';
import { updateUserById } from '@/repositories/users/user.repository';
import { AUTH_ERROR_CODES } from '@domain/auth/auth.errors';
import type { User } from '@prisma/client';
import { compare } from 'bcryptjs';

const MAX_FAILED_LOGIN_ATTEMPTS = 10;
const ACCOUNT_LOCK_DURATION_MS = 1000 * 60 * 15; // 15 minutes

export async function verifyPassword(user: User, password: string, pipeline: RateLimitPipeline): Promise<User> {
  const isValid = await compare(password, user.passwordHash ?? '');

  if (isValid) {
    return user;
  }

  let recordContext: AccountRateLimitLogContext;

  try {
    recordContext = await recordRateLimitFailure(pipeline);
  } catch (error) {
    console.error('[auth] rate limit failure recording failed, falling back to prisma counter', error);
    await incrementFallbackAttempt(user);
    throw new Error(AUTH_ERROR_CODES.InvalidCredentials);
  }

  const errorCode = recordContext.result.allowed
    ? AUTH_ERROR_CODES.InvalidCredentials
    : resolveRateLimitErrorCode(recordContext.result.retryAfterSeconds);
  const error = new Error(errorCode) as RateLimitedError;
  error.accountRateLimit = recordContext;
  throw error;
}

export async function resetLoginState(user: User): Promise<User> {
  if (user.loginAttempts === 0 && !user.lockedUntil) {
    return user;
  }

  return updateUserById(user.id, { loginAttempts: 0, lockedUntil: null });
}

async function incrementFallbackAttempt(user: User): Promise<void> {
  const nextAttempts = user.loginAttempts + 1;

  if (nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
    const expiresAt = new Date(Date.now() + ACCOUNT_LOCK_DURATION_MS);
    await updateUserById(user.id, { loginAttempts: 0, lockedUntil: expiresAt });
    throw new Error(AUTH_ERROR_CODES.AccountTemporarilyLocked);
  }

  await updateUserById(user.id, { loginAttempts: nextAttempts });
}
