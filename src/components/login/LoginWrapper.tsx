'use client';

import { LoginForm } from '@/components/login/LoginForm';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

export function LoginWrapper({
  recaptchaSiteKey,
  callbackUrl,
  errorCode,
}: {
  recaptchaSiteKey: string;
  callbackUrl: string;
  errorCode: string | null;
}) {
  if (!recaptchaSiteKey) {
    return <LoginForm callbackUrl={callbackUrl} errorCode={errorCode} />;
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey} scriptProps={{ async: true, defer: true }}>
      <LoginForm recaptchaSiteKey={recaptchaSiteKey} callbackUrl={callbackUrl} errorCode={errorCode} />
    </GoogleReCaptchaProvider>
  );
}
