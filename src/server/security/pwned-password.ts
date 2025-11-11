import crypto from 'node:crypto';

export type PwnedPasswordCheckResult = {
  compromised: boolean;
  count: number;
};

type PwnedPasswordConfig = {
  enabled: boolean;
  maxCount: number;
  timeoutMs: number;
  apiBaseUrl: string;
};

export const cachedConfig: PwnedPasswordConfig = {
  enabled: Boolean(process.env.PWNED_PASSWORD_VALIDATION_ENABLED),
  maxCount: Number(process.env.PWNED_PASSWORD_MAX_COUNT) ?? 1,
  timeoutMs: Number(process.env.PWNED_PASSWORD_TIMEOUT_MS) ?? 2000,
  apiBaseUrl: 'https://api.pwnedpasswords.com',
} as const;

const DEFAULT_USER_AGENT = 'next-prot/pwned-password-check' as const;

const PREFIX_LENGTH = 5 as const;

export async function checkPwnedPassword(password: string): Promise<PwnedPasswordCheckResult> {
  if (!cachedConfig.enabled) {
    return { compromised: false, count: 0 };
  }

  const sha1Hash = hashPasswordToSha1(password);
  const prefix = sha1Hash.slice(0, PREFIX_LENGTH);
  const suffix = sha1Hash.slice(PREFIX_LENGTH);

  try {
    const suffixes = await fetchPwnedPasswordSuffixes(prefix);
    const count = suffixes.get(suffix) ?? 0;
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

    if (!response.ok) {
      throw new Error(`pwned-password-response:${response.status}`);
    }

    const body = await response.text();
    return parseRangeResponse(body);
  } finally {
    clearTimeout(timeoutId);
  }
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
