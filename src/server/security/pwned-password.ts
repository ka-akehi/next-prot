import { getEnvBoolean, getEnvNumber, getEnvString } from '@/shared/env';
import crypto from 'node:crypto';

export type PwnedPasswordCheckResult = {
  compromised: boolean;
  count: number;
};

const DEFAULT_USER_AGENT = 'next-prot/pwned-password-check' as const;

const PREFIX_LENGTH = 5 as const;

const DEFAULT_SUFFIX_COUNT = 1 as const;
const DEFAULT_MAX_COUNT = 1 as const;
const DEFAULT_TIMEOUT_MS = 2000 as const;
const DEFAULT_API_BASE_URL = 'https://api.pwnedpasswords.com' as const;
const DEFAULT_RETRY_LIMIT = 3 as const;
const DEFAULT_RETRY_DELAY_MS = 200 as const;

type PwnedPasswordConfig = {
  enabled: boolean;
  maxCount: number;
  timeoutMs: number;
  apiBaseUrl: string;
  retryLimit: number;
  retryDelayMs: number;
};

export const cachedConfig: PwnedPasswordConfig = {
  enabled: getEnvBoolean('PWNED_PASSWORD_VALIDATION_ENABLED', false),
  maxCount: getEnvNumber('PWNED_PASSWORD_MAX_COUNT', DEFAULT_MAX_COUNT),
  timeoutMs: getEnvNumber('PWNED_PASSWORD_TIMEOUT_MS', DEFAULT_TIMEOUT_MS),
  apiBaseUrl: getEnvString('PWNED_PASSWORD_API_BASE_URL', DEFAULT_API_BASE_URL),
  retryLimit: getEnvNumber('PWNED_PASSWORD_MAX_RETRIES', DEFAULT_RETRY_LIMIT),
  retryDelayMs: getEnvNumber('PWNED_PASSWORD_RETRY_DELAY_MS', DEFAULT_RETRY_DELAY_MS),
};

export async function checkPwnedPassword(password: string): Promise<PwnedPasswordCheckResult> {
  if (!cachedConfig.enabled) {
    return { compromised: false, count: DEFAULT_SUFFIX_COUNT };
  }

  const sha1Hash = hashPasswordToSha1(password);
  const prefix = sha1Hash.slice(0, PREFIX_LENGTH);
  const suffix = sha1Hash.slice(PREFIX_LENGTH);

  try {
    const suffixes = await fetchPwnedPasswordSuffixes(prefix);
    const count = suffixes.get(suffix) ?? DEFAULT_SUFFIX_COUNT;
    const compromised = count >= cachedConfig.maxCount;

    if (compromised) {
      console.warn('[pwned-password] compromised password detected', { prefix, count });
    }

    return { compromised, count };
  } catch (error) {
    console.warn('[pwned-password] failed to verify password against HIBP', error);
    // フェイルクローズ: 判定不能時も拒否扱いにする
    return { compromised: true, count: cachedConfig.maxCount };
  }
}

export function hashPasswordToSha1(password: string): string {
  return crypto.createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
}

async function fetchPwnedPasswordSuffixes(prefix: string): Promise<Map<string, number>> {
  let lastError: unknown;
  const attempts = Math.max(1, cachedConfig.retryLimit);

  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), cachedConfig.timeoutMs);

    try {
      const response = await fetch(`${cachedConfig.apiBaseUrl}/range/${prefix}`, {
        method: 'GET',
        headers: {
          'Add-Padding': 'true',
          'User-Agent': DEFAULT_USER_AGENT,
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      if (response.ok) {
        const body = await response.text();
        return parseRangeResponse(body);
      }

      lastError = new Error(`pwned-password-response:${response.status}`);
      if (!isRetryableStatus(response.status) || attempt === attempts - 1) {
        throw lastError;
      }
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) {
        throw error;
      }
    } finally {
      clearTimeout(timeoutId);
    }

    await delay(cachedConfig.retryDelayMs * 2 ** attempt);
  }

  throw lastError instanceof Error ? lastError : new Error('pwned-password:unknown-error');
}

const PARSE_INT = 10 as const;
const RETURN_SUFFIX_LENGTH = 35 as const;

function parseRangeResponse(body: string): Map<string, number> {
  const map = new Map<string, number>();
  if (!body) {
    return map;
  }

  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    if (!line) continue;
    const [suffixRaw, countRaw] = line.split(':');
    if (!suffixRaw || !countRaw) continue;

    const suffix = suffixRaw.trim().toUpperCase();
    const count = Number.parseInt(countRaw.trim(), PARSE_INT);
    if (suffix.length !== RETURN_SUFFIX_LENGTH || !Number.isFinite(count)) {
      continue;
    }

    map.set(suffix, count);
  }

  return map;
}

function isRetryableStatus(status: number): boolean {
  if (status === 429) {
    return true;
  }

  if (status >= 500 && status < 600) {
    return true;
  }

  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}
