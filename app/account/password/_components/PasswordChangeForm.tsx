'use client';

import { PasswordFormLayout } from '@/app/account/password/_components/PasswordFormLayout';
import { usePasswordManageViewModel } from '@/view_model/auth/use-password-manage-view-model';

type PasswordChangeFormProps = {
  redirectUrl?: string;
};

export function PasswordChangeForm({ redirectUrl }: PasswordChangeFormProps) {
  const {
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
  } = usePasswordManageViewModel({
    onSuccessRedirectUrl: redirectUrl,
    requireCurrentPassword: true,
    successMessage: 'パスワードを変更しました',
  });

  return (
    <PasswordFormLayout
      title="パスワードの変更"
      onSubmitAction={handleSubmit}
      isSubmitting={isSubmitting}
      password={password}
      onPasswordChangeAction={setPassword}
      confirmPassword={confirmPassword}
      onConfirmPasswordChangeAction={setConfirmPassword}
      error={error}
      success={success}
      requireCurrentPassword
      currentPassword={currentPassword}
      onCurrentPasswordChangeAction={setCurrentPassword}
    />
  );
}
