import { LoginWrapper } from '@/components/login/LoginWrapper';
import { getEnvString } from '@/shared/env';

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const recaptchaSiteKey = getEnvString('NEXT_PUBLIC_RECAPTCHA_SITE_KEY', '');

  const callbackUrl = (await searchParams)?.callbackUrl || '/bbs';
  const errorCode = (await searchParams)?.error ?? null;

  return <LoginWrapper recaptchaSiteKey={recaptchaSiteKey} callbackUrl={callbackUrl} errorCode={errorCode} />;
}
