'use client';

import { PasswordFormLayout } from '@/app/account/password/_components/PasswordFormLayout';
import { usePasswordManageViewModel } from '@/view_model/auth/use-password-manage-view-model';

type PasswordSetupFormProps = {
  redirectUrl?: string;
};

export function PasswordSetupForm({ redirectUrl }: PasswordSetupFormProps) {
  const { password, setPassword, confirmPassword, setConfirmPassword, error, success, isSubmitting, handleSubmit } =
    usePasswordManageViewModel({
      onSuccessRedirectUrl: redirectUrl,
      successMessage: 'パスワードを設定しました',
    });

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
