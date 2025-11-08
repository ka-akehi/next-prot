const VERIFY_ENDPOINT = 'https://www.google.com/recaptcha/api/siteverify';

type RecaptchaVerifyResponse = {
  success: boolean;
  score?: number;
  action?: string;
};

export type RecaptchaVerificationResult = {
  success: boolean;
  score: number | null;
  action?: string;
};

export async function verifyRecaptchaToken(
  token: string,
  secretKey: string,
  clientIp?: string | null
): Promise<RecaptchaVerificationResult> {
  const params = new URLSearchParams({
    secret: secretKey ?? '',
    response: token,
  });

  if (clientIp) {
    params.append('remoteip', clientIp);
  }

  const response = await fetch(VERIFY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!response.ok) {
    throw new Error(`Failed to verify reCAPTCHA (status ${response.status})`);
  }

  const data = (await response.json()) as RecaptchaVerifyResponse;

  return {
    success: data.success,
    score: data.score ? data.score : null,
    action: data.action,
  };
}
