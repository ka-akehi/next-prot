'use client';

import { PasswordFormLayout } from '@/app/account/password/_components/PasswordFormLayout';
import { usePasswordSetupViewModel } from '@/view_model/auth/use-password-setup-view-model';

type PasswordSetupFormProps = {
  email?: string;
  token?: string;
  redirectUrl?: string;
};

export function PasswordSetupForm({ email, token, redirectUrl }: PasswordSetupFormProps) {
  const { password, setPassword, confirmPassword, setConfirmPassword, error, success, isSubmitting, handleSubmit } =
    usePasswordSetupViewModel({ email, token, redirectUrl });

  return (
    <PasswordFormLayout
      title="メールログイン用パスワード設定"
      onSubmitAction={handleSubmit}
      isSubmitting={isSubmitting}
      password={password}
      onPasswordChangeAction={setPassword}
      confirmPassword={confirmPassword}
      onConfirmPasswordChangeAction={setConfirmPassword}
      error={error}
      success={success}
    />
  );
}
