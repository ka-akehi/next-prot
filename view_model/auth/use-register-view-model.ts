import { AUTH_ERROR_MESSAGES, AUTH_PROCESS_ERROR_MESSAGES, DEFAULT_AUTH_ERROR_MESSAGE } from '@/lib/auth.errors';
import {
  PASSWORD_ERROR_MESSAGES,
  REGISTER_ERROR_MESSAGES,
  REGISTER_SUCCESS_MESSAGES,
} from '@/lib/error.messages';
import { MIN_PASSWORD_LENGTH, isPasswordComplex } from '@/lib/password-policy';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useState } from 'react';

type UseRegisterViewModelParams = {
  callbackUrl: string;
};

export function useRegisterViewModel({ callbackUrl }: UseRegisterViewModelParams) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setSuccess(null);
      setRequiresPasswordSetup(false);

      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(PASSWORD_ERROR_MESSAGES.tooShort(MIN_PASSWORD_LENGTH));
        return;
      }

      if (!isPasswordComplex(password)) {
        setError(PASSWORD_ERROR_MESSAGES.complexity);
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data?.error ?? REGISTER_ERROR_MESSAGES.failed);

          if (response.status === 409) {
            setRequiresPasswordSetup(true);
            const baseRedirect =
              typeof data?.redirectTo === 'string' && data.redirectTo
                ? data.redirectTo
                : '/account/password/new';
            const searchParams = new URLSearchParams();
            searchParams.set('redirect', callbackUrl);
            if (typeof data?.passwordSetupToken === 'string') {
              searchParams.set('token', data.passwordSetupToken);
            }
            if (typeof data?.email === 'string') {
              searchParams.set('email', data.email);
            }
            const separator = baseRedirect.includes('?') ? '&' : '?';
            const redirectUrl = `${baseRedirect}${separator}${searchParams.toString()}`;
            router.push(redirectUrl);
          }

          setIsSubmitting(false);
          return;
        }

        setSuccess(REGISTER_SUCCESS_MESSAGES.completed);
        setRequiresPasswordSetup(false);

        const signInResult = await signIn('credentials', {
          redirect: false,
          email,
          password,
          callbackUrl,
        });

        if (signInResult?.error) {
          const mappedMessage =
            AUTH_ERROR_MESSAGES[signInResult.error as keyof typeof AUTH_ERROR_MESSAGES];
          setError(mappedMessage ?? DEFAULT_AUTH_ERROR_MESSAGE);
          setIsSubmitting(false);
          return;
        }

        router.push(signInResult?.url ?? callbackUrl);
      } catch (err) {
        console.error('[register] unexpected error', err);
        setError(AUTH_PROCESS_ERROR_MESSAGES.register);
        setIsSubmitting(false);
      }
    },
    [callbackUrl, email, name, password, router]
  );

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    success,
    isSubmitting,
    handleSubmit,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    requiresPasswordSetup,
  };
}
