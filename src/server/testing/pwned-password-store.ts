import { RETURN_SUFFIX_LENGTH } from '@/server/security/pwned-password';

export type PwnedPasswordOverrideInput = Record<string, Record<string, number>>;

type OverrideStore = Map<string, Map<string, number>>;

const store: OverrideStore = new Map();

export function setPwnedPasswordOverrides(overrides: PwnedPasswordOverrideInput): number {
  clearPwnedPasswordOverrides();

  if (!overrides) {
    return 0;
  }

  for (const [prefix, suffixes] of Object.entries(overrides)) {
    const normalizedPrefix = prefix.trim().toUpperCase();
    if (!normalizedPrefix) continue;

    const suffixMap = new Map<string, number>();
    if (suffixes) {
      for (const [suffix, rawCount] of Object.entries(suffixes)) {
        const normalizedSuffix = suffix.trim().toUpperCase();
        const count = Number(rawCount);
        if (!normalizedSuffix || normalizedSuffix.length !== RETURN_SUFFIX_LENGTH || !Number.isFinite(count)) {
          continue;
        }
        suffixMap.set(normalizedSuffix, count);
      }
    }

    store.set(normalizedPrefix, suffixMap);
  }

  return store.size;
}

export function clearPwnedPasswordOverrides(): void {
  store.clear();
}

export function buildRangeResponse(prefix: string): string {
  if (!prefix) {
    return '';
  }

  const normalizedPrefix = prefix.trim().toUpperCase();
  const suffixes = store.get(normalizedPrefix);
  if (!suffixes || suffixes.size === 0) {
    return '';
  }

  const lines: string[] = [];
  suffixes.forEach((count, suffix) => {
    lines.push(`${suffix}:${count}`);
  });

  return lines.join('\n');
}
