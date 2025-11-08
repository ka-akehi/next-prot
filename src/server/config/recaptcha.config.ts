export type RecaptchaConfig = {
  enabled: boolean;
  secretKey: string;
  scoreThreshold: number;
};

const DEFAULT_SCORE = 0.5;
const RAW_SCORE = Number(process.env.RECAPTCHA_SCORE_THRESHOLD);
const RAW_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY ?? '';

let cachedConfig: RecaptchaConfig | null = null;

export function getRecaptchaConfig(): RecaptchaConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const scoreThreshold = normalizeScoreThreshold(RAW_SCORE);

  cachedConfig = {
    enabled: !!RAW_SECRET_KEY.trim(),
    secretKey: RAW_SECRET_KEY,
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
