import { resetLoginState, verifyPassword } from '@/helpers/auth/password';
import {
  recordRateLimitFailure,
  resetRateLimitState,
  resolveRateLimitErrorCode,
  type AccountRateLimitLogContext,
  type RateLimitedError,
  type RateLimitPipeline,
} from '@/helpers/auth/rate-limit';
import { findUserByEmailCandidates, updateUserById } from '@/repositories/users/user.repository';
import type { AuthAttemptResult } from '@/types/auth-attempt-log';
import { issuePasswordSetupToken } from '@application/auth/password-token';
import {
  AUTH_ERROR_CODES,
  AUTH_ERROR_TYPE,
  AuthErrorTypeCode,
  createPasswordRequiredError,
  PASSWORD_REQUIRED_ERROR_PREFIX,
} from '@domain/auth/auth.errors';
import type { User } from '@prisma/client';

export type VerifyPasswordResult = {
  user: User;
  accountRateLimit?: AccountRateLimitLogContext;
};

export async function fetchUserForEmail(normalizedEmail: string, rawEmail: string): Promise<User> {
  const user = await findUserByEmailCandidates([normalizedEmail, rawEmail]);

  if (!user) {
    throw new Error(AUTH_ERROR_CODES.InvalidCredentials);
  }

  if (user.email && user.email !== normalizedEmail) {
    return updateUserById(user.id, { email: normalizedEmail });
  }

  return user;
}

export async function resetLoginStateIfExpired(user: User): Promise<User> {
  const shouldReset = user.lockedUntil && user.lockedUntil <= new Date();

  if (!shouldReset) {
    return user;
  }

  return updateUserById(user.id, { lockedUntil: null, loginAttempts: 0 });
}

export async function ensurePasswordIsConfigured(user: User, callbackUrl: string): Promise<void> {
  if (user.passwordHash) {
    return;
  }

  const emailForSetup = user.email || '';
  const { token } = await issuePasswordSetupToken(user.id);
  const setupUrl = buildPasswordSetupUrl(callbackUrl, emailForSetup, token);

  throw new Error(createPasswordRequiredError(setupUrl));
}

export function ensureAccountNotLocked(user: User): void {
  const locked = user.lockedUntil && user.lockedUntil > new Date();

  if (locked) {
    throw new Error(AUTH_ERROR_CODES.AccountTemporarilyLocked);
  }
}

export async function verifyPasswordOrThrow(
  user: User,
  password: string,
  pipeline: RateLimitPipeline
): Promise<VerifyPasswordResult> {
  const enforceContext = pipeline.enforceContext;
  if (enforceContext?.result && !enforceContext.result.allowed) {
    const recordContext = await recordRateLimitFailure(pipeline);
    const errorCode = resolveRateLimitErrorCode(recordContext.result.retryAfterSeconds);
    const error = new Error(errorCode) as RateLimitedError;
    error.accountRateLimit = recordContext;
    throw error;
  }

  const verifiedUser = await verifyPassword(user, password, pipeline);
  const normalizedUser = await resetLoginState(verifiedUser);
  const resetContext = await resetRateLimitState(pipeline);

  return {
    user: normalizedUser,
    accountRateLimit: resetContext ?? pipeline.enforceContext,
  };
}

export async function markTwoFactorPending(user: User): Promise<User> {
  if (!user.twoFactorEnabled) {
    return user;
  }

  return updateUserById(user.id, { lastTwoFactorAt: null });
}

export function mapErrorToAttemptResult(error: unknown): AuthAttemptResult {
  if (!(error instanceof Error) || !error.message) {
    return 'error';
  }

  const message = error.message;

  if (message.startsWith(PASSWORD_REQUIRED_ERROR_PREFIX)) {
    return 'mfa-required';
  }

  return AUTH_ERROR_TYPE[message as AuthErrorTypeCode] ?? 'error';
}

function buildPasswordSetupUrl(callbackUrl: string, email: string, token: string): string {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    throw new Error(AUTH_ERROR_CODES.InvalidCredentials);
  }

  return `/account/password/new?redirect=${encodeURIComponent(callbackUrl)}&token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(trimmedEmail)}`;
}
