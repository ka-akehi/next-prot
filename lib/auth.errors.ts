export const PASSWORD_REQUIRED_ERROR_PREFIX = 'PASSWORD_REQUIRED:' as const;

export const AUTH_ERROR_CODES = {
  MissingCredentials: 'MissingCredentials',
  InvalidCredentials: 'CredentialsSignin',
  AccountLocked: 'AccountLocked',
  AccountTemporarilyLocked: 'AccountTemporarilyLocked',
  OAuthAccountNotLinked: 'OAuthAccountNotLinked',
  AccessDenied: 'AccessDenied',
} as const;

type AuthErrorCodesValue = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export type AuthErrorCode = AuthErrorCodesValue;

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCodesValue, string> = {
  [AUTH_ERROR_CODES.MissingCredentials]: 'メールアドレスとパスワードを入力してください',
  [AUTH_ERROR_CODES.InvalidCredentials]: 'メールアドレスまたはパスワードが正しくありません',
  [AUTH_ERROR_CODES.AccountLocked]: 'アカウントがロックされています。管理者にお問い合わせください',
  [AUTH_ERROR_CODES.AccountTemporarilyLocked]:
    'アカウントが一時的にロックされています。時間をおいて再度お試しください',
  [AUTH_ERROR_CODES.OAuthAccountNotLinked]:
    '別のログイン方法で登録済みです。同じプロバイダでログインしてください。',
  [AUTH_ERROR_CODES.AccessDenied]: 'アクセスが拒否されました',
};

export const DEFAULT_AUTH_ERROR_MESSAGE = 'ログインに失敗しました。時間をおいて再度お試しください。';

export const AUTH_PROCESS_ERROR_MESSAGES = {
  login: 'ログイン処理中にエラーが発生しました',
  register: '登録処理中にエラーが発生しました',
} as const;

export function createPasswordRequiredError(redirectUrl: string) {
  return `${PASSWORD_REQUIRED_ERROR_PREFIX}${redirectUrl}`;
}
