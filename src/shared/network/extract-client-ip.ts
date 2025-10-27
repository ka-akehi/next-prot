export type HeaderValue = string | string[] | undefined;
export type HeadersLike = Headers | Record<string, HeaderValue> | undefined;

export function resolveHeader(headers: HeadersLike | undefined, name: string): string | undefined {
  if (!headers) return undefined;

  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }

  const record = headers as Record<string, HeaderValue>;
  const direct = record[name];

  if (Array.isArray(direct)) {
    return direct[0];
  }

  return typeof direct === 'string' ? direct : undefined;
}

export function extractClientIpFromHeaders(headers: HeadersLike): string {
  const candidates = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'x-client-ip', 'x-vercel-forwarded-for'];

  for (const key of candidates) {
    const raw = resolveHeader(headers, key);
    if (!raw) continue;
    if (key === 'x-forwarded-for') {
      const [first] = raw.split(',');
      if (first && first.trim()) {
        return first.trim();
      }
      continue;
    }
    if (raw.trim()) {
      return raw.trim();
    }
  }

  return 'unknown';
}
