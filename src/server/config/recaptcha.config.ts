import { getEnvNumber, getEnvString } from '@/shared/env';

export type RecaptchaConfig = {
  enabled: boolean;
  secretKey: string;
  scoreThreshold: number;
};

const DEFAULT_SCORE = 0.5;

let cachedConfig: RecaptchaConfig | null = null;

export function getRecaptchaConfig(): RecaptchaConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const secretKey = getEnvString('RECAPTCHA_SECRET_KEY', '');
  const rawScore = getEnvNumber('RECAPTCHA_SCORE_THRESHOLD', DEFAULT_SCORE);
  const scoreThreshold = normalizeScoreThreshold(rawScore);

  cachedConfig = {
    enabled: !!secretKey.trim(),
    secretKey,
    scoreThreshold,
  };

  return cachedConfig;
}

function normalizeScoreThreshold(raw: number): number {
  if (!Number.isFinite(raw)) {
    return DEFAULT_SCORE;
  }

  if (raw <= 0 || raw > 1) {
    throw new Error('RECAPTCHA_SCORE_THRESHOLD must be a number between 0 and 1');
  }

  return raw;
}
