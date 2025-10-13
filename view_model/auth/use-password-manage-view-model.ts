import { PASSWORD_ERROR_MESSAGES, PASSWORD_SUCCESS_MESSAGES } from '@/lib/error.messages';
import { MIN_PASSWORD_LENGTH, isPasswordComplex } from '@/lib/password-policy';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

type UsePasswordManageViewModelParams = {
  onSuccessRedirectUrl?: string;
  requireCurrentPassword?: boolean;
  successMessage?: string;
};

export function usePasswordManageViewModel({
  onSuccessRedirectUrl,
  requireCurrentPassword = false,
  successMessage,
}: UsePasswordManageViewModelParams = {}) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(PASSWORD_ERROR_MESSAGES.tooShort(MIN_PASSWORD_LENGTH));
      return;
    }

    if (!isPasswordComplex(password)) {
      setError(PASSWORD_ERROR_MESSAGES.complexity);
      return;
    }

    if (password !== confirmPassword) {
      setError(PASSWORD_ERROR_MESSAGES.mismatch);
      return;
    }

    if (requireCurrentPassword && !currentPassword) {
      setError(PASSWORD_ERROR_MESSAGES.currentRequired);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error ?? PASSWORD_ERROR_MESSAGES.updateFailed);
        return;
      }

      setSuccess(successMessage ?? PASSWORD_SUCCESS_MESSAGES.updated);

      if (onSuccessRedirectUrl) {
        router.push(onSuccessRedirectUrl);
        return;
      }

      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('[password-manage] unexpected error', err);
      setError(PASSWORD_ERROR_MESSAGES.updateFailed);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    confirmPassword,
    currentPassword,
    onSuccessRedirectUrl,
    password,
    requireCurrentPassword,
    router,
    successMessage,
  ]);

  return {
    currentPassword,
    setCurrentPassword,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    success,
    isSubmitting,
    handleSubmit,
  };
}
