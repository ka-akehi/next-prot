import { findUserByEmailCandidates, updateUserById } from '@/repositories/users/user.repository';
import type { AuthAttemptResult } from '@/types/auth-attempt-log';
import { issuePasswordSetupToken } from '@application/auth/password-token';
import {
  AUTH_ERROR_CODES,
  PASSWORD_REQUIRED_ERROR_PREFIX,
  createPasswordRequiredError,
} from '@domain/auth/auth.errors';
import type { User } from '@prisma/client';
import { compare } from 'bcryptjs';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_DURATION_MS = 1000 * 60 * 15; // 15 minutes

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

export async function ensurePasswordIsConfigured(
  user: User,
  normalizedEmail: string,
  callbackUrl: string
): Promise<void> {
  if (user.passwordHash) {
    return;
  }

  const { token } = await issuePasswordSetupToken(user.id);
  const setupUrl = buildPasswordSetupUrl(callbackUrl, normalizedEmail, token);

  throw new Error(createPasswordRequiredError(setupUrl));
}

export function ensureAccountNotLocked(user: User): void {
  const locked = user.lockedUntil && user.lockedUntil > new Date();

  if (locked) {
    throw new Error(AUTH_ERROR_CODES.AccountTemporarilyLocked);
  }
}

export async function verifyPasswordOrThrow(user: User, password: string): Promise<User> {
  const isValid = await compare(password, user.passwordHash ?? '');

  if (!isValid) {
    return handleFailedPassword(user);
  }

  if (user.loginAttempts !== 0 || user.lockedUntil) {
    return updateUserById(user.id, { loginAttempts: 0, lockedUntil: null });
  }

  return user;
}

export async function markTwoFactorPending(user: User): Promise<User> {
  if (!user.twoFactorEnabled) {
    return user;
  }

  return updateUserById(user.id, { lastTwoFactorAt: null });
}

export function mapErrorToAttemptResult(error: unknown): AuthAttemptResult {
  if (!(error instanceof Error)) {
    return 'error';
  }

  const message = error.message ?? '';

  if (message === AUTH_ERROR_CODES.InvalidCredentials || message === AUTH_ERROR_CODES.MissingCredentials) {
    return 'invalid-credentials';
  }

  if (message === AUTH_ERROR_CODES.AccountLocked || message === AUTH_ERROR_CODES.AccountTemporarilyLocked) {
    return 'locked';
  }

  if (
    message.startsWith(PASSWORD_REQUIRED_ERROR_PREFIX) ||
    message === AUTH_ERROR_CODES.TwoFactorRequired ||
    message === AUTH_ERROR_CODES.InvalidTwoFactorCode
  ) {
    return 'mfa-required';
  }

  return 'error';
}

async function handleFailedPassword(user: User): Promise<never> {
  const nextAttempts = user.loginAttempts + 1;

  if (nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
    const lockExpiresAt = new Date(Date.now() + ACCOUNT_LOCK_DURATION_MS);

    await updateUserById(user.id, {
      loginAttempts: 0,
      lockedUntil: lockExpiresAt,
    });

    throw new Error(AUTH_ERROR_CODES.AccountTemporarilyLocked);
  }

  await updateUserById(user.id, { loginAttempts: nextAttempts });

  throw new Error(AUTH_ERROR_CODES.InvalidCredentials);
}

function buildPasswordSetupUrl(callbackUrl: string, normalizedEmail: string, token: string): string {
  return `/account/password/new?redirect=${encodeURIComponent(callbackUrl)}&token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(normalizedEmail)}`;
}
