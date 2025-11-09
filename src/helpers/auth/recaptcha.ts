import { getRecaptchaConfig } from '@/server/config/recaptcha.config';
import type { AccountRateLimitResult } from '@/server/rate-limit/account-rate-limiter';
import { verifyRecaptchaToken } from '@/server/security/recaptcha';
import { AUTH_ERROR_CODES } from '@domain/auth/auth.errors';

export type RecaptchaEnforcementOptions = {
  captchaToken?: string | null;
  clientIp?: string | null;
};

export async function enforceRecaptchaRequirement(
  rateLimitResult: AccountRateLimitResult | undefined,
  options: RecaptchaEnforcementOptions
): Promise<void> {
  if (!shouldRequireRecaptcha(rateLimitResult)) {
    return;
  }

  const config = getRecaptchaConfig();

  if (!config.enabled) {
    console.warn('[auth] reCAPTCHA required but RECAPTCHA_SECRET_KEY is not configured');
    throw createRecaptchaError();
  }

  const token = options.captchaToken;
  if (!token) {
    throw createRecaptchaError();
  }

  try {
    const verification = await verifyRecaptchaToken(token, config.secretKey, options.clientIp);

    if (!verification.success) {
      throw new Error('recaptcha-verification-failed');
    }

    if (verification.score !== null && verification.score < config.scoreThreshold) {
      throw new Error(`recaptcha-score-too-low:${verification.score}`);
    }
  } catch (error) {
    console.error('[auth] reCAPTCHA verification failed', error);
    throw createRecaptchaError();
  }
}

export function shouldRequireRecaptcha(result?: AccountRateLimitResult): boolean {
  if (!result) {
    return false;
  }
  return result.consecutiveFailures >= result.threshold;
}

function createRecaptchaError(): Error {
  return new Error(AUTH_ERROR_CODES.RecaptchaFailed);
}
