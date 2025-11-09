import {
  AUTH_ERROR_MESSAGES,
  AUTH_PROCESS_ERROR_MESSAGES,
  DEFAULT_AUTH_ERROR_MESSAGE,
  PASSWORD_REQUIRED_ERROR_PREFIX,
} from '@domain/auth/auth.errors';
import type { Session } from 'next-auth';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

const REDIRECT_PATH_AFTER_AUTH = '/bbs';

type UseLoginViewModelParams = {
  callbackUrl: string;
  errorCode: string | null;
};

type RateLimitStatus = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
  threshold: number;
  consecutiveFailures: number;
  captchaRequired: boolean;
};

export function useLoginViewModel({ callbackUrl, errorCode }: UseLoginViewModelParams) {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);

  const initialErrorMessage = useMemo(() => {
    if (!errorCode) return null;
    if (errorCode.startsWith(PASSWORD_REQUIRED_ERROR_PREFIX)) {
      return null;
    }
    const mappedMessage = AUTH_ERROR_MESSAGES[errorCode as keyof typeof AUTH_ERROR_MESSAGES];
    return mappedMessage ?? DEFAULT_AUTH_ERROR_MESSAGE;
  }, [errorCode]);

  useEffect(() => {
    if (errorCode?.startsWith(PASSWORD_REQUIRED_ERROR_PREFIX)) {
      const redirectTarget = errorCode.slice(PASSWORD_REQUIRED_ERROR_PREFIX.length) || '/account/password/new';
      router.replace(redirectTarget);
    }
  }, [errorCode, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(REDIRECT_PATH_AFTER_AUTH);
    }
  }, [status, router]);

  useEffect(() => {
    if (initialErrorMessage) {
      setFormError(initialErrorMessage);
    }
  }, [initialErrorMessage]);

  const fetchSession = useCallback(async (): Promise<Session | null> => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!response.ok) return null;
      return (await response.json()) as Session;
    } catch (error) {
      console.error('[login] failed to fetch session', error);
      return null;
    }
  }, []);

  const needsTwoFactorVerification = useCallback(async () => {
    const session = await fetchSession();
    return Boolean(session?.user?.twoFactorEnabled && !session?.user?.twoFactorVerified);
  }, [fetchSession]);

  const fetchRateLimitStatus = useCallback(async (identifier: string): Promise<RateLimitStatus | null> => {
    try {
      const response = await fetch('/api/auth/rate-limit/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: identifier.toLowerCase() }),
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as RateLimitStatus;
    } catch (error) {
      console.error('[login] failed to fetch rate limit status', error);
      return null;
    }
  }, []);

  const refreshRateLimitStatus = useCallback(async (): Promise<RateLimitStatus | null> => {
    const normalized = email.trim();

    if (!normalized) {
      setRateLimitStatus(null);
      return null;
    }

    const status = await fetchRateLimitStatus(normalized);
    setRateLimitStatus(status);

    return status;
  }, [email, fetchRateLimitStatus]);

  useEffect(() => {
    if (!email.trim()) {
      setRateLimitStatus(null);
      return;
    }

    const timer = setTimeout(() => {
      void refreshRateLimitStatus();
    }, 500);

    return () => clearTimeout(timer);
  }, [email, refreshRateLimitStatus]);

  const handleCredentialsLogin = useCallback(
    async (captchaToken?: string | null) => {
      setFormError(null);
      setIsSubmitting(true);

      try {
        const latestStatus = await refreshRateLimitStatus();
        if (latestStatus?.captchaRequired && !captchaToken) {
          setFormError('reCAPTCHA を完了してください');
          setIsSubmitting(false);
          return;
        }

        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
          callbackUrl,
          captchaToken,
        });

        if (result?.error) {
          if (result.error.startsWith(PASSWORD_REQUIRED_ERROR_PREFIX)) {
            const redirectTarget = result.error.slice(PASSWORD_REQUIRED_ERROR_PREFIX.length) || '/account/password/new';
            router.push(redirectTarget);
            return;
          }

          const mappedMessage = AUTH_ERROR_MESSAGES[result.error as keyof typeof AUTH_ERROR_MESSAGES];
          const message = mappedMessage ?? DEFAULT_AUTH_ERROR_MESSAGE;
          setFormError(message);
          return;
        }

        const requires2FA = await needsTwoFactorVerification();

        if (requires2FA) {
          router.push(`/2fa/verify?callbackUrl=${encodeURIComponent(callbackUrl)}`);
          return;
        }

        await fetch('/api/auth/session?update', { cache: 'no-store' }).catch(() => undefined);
        router.push(result?.url ?? callbackUrl);
      } catch (error) {
        console.error('[login] credentials sign-in failed', error);
        setFormError(AUTH_PROCESS_ERROR_MESSAGES.login);
      } finally {
        await refreshRateLimitStatus();
        setIsSubmitting(false);
      }
    },
    [callbackUrl, email, needsTwoFactorVerification, password, refreshRateLimitStatus, router]
  );

  return {
    status,
    email,
    setEmail,
    password,
    setPassword,
    formError,
    isSubmitting,
    handleCredentialsLogin,
    rateLimitStatus,
  };
}
