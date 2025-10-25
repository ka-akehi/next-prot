import fs from 'node:fs';
import path from 'node:path';
import type { AuthAttemptLog, AuthAttemptResult } from '@/types/auth-attempt-log';

type HeaderValue = string | string[] | undefined;
type HeadersLike = Headers | Record<string, HeaderValue>;

type RequestLike = {
  headers?: HeadersLike;
  url?: string | null;
};

type LogAuthAttemptOptions = {
  username: string | null;
  result: AuthAttemptResult;
  reason?: string;
  req?: RequestLike | null;
  context?: Record<string, unknown>;
};

const DEFAULT_PATH = '/api/auth/[...nextauth]';
const LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'auth-attempts.log');

export async function logAuthAttempt(options: LogAuthAttemptOptions): Promise<void> {
  const headers = options.req?.headers;
  const entry: AuthAttemptLog = {
    timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    ip: extractClientIp(headers),
    username: options.username,
    path: extractPath(options.req?.url),
    userAgent: resolveHeader(headers, 'user-agent') ?? 'unknown',
    result: options.result,
  };

  if (options.reason) entry.reason = options.reason;

  const requestId = resolveHeader(headers, 'x-request-id') ?? undefined;
  if (requestId) {
    entry.requestId = requestId;
  }

  if (Object.keys(options.context || {}).length > 0) {
    entry.context = options.context;
  }

  try {
    await ensureLogDirectory();
    await fs.promises.appendFile(LOG_FILE_PATH, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (error) {
    // ログ収集の失敗でアプリの処理が止まらないようにする
    console.error('Failed to write auth attempt log', error);
  }
}

async function ensureLogDirectory() {
  const dirName = path.dirname(LOG_FILE_PATH);
  if (fs.existsSync(dirName)) return;
  await fs.promises.mkdir(dirName, { recursive: true });
}

function resolveHeader(headers: HeadersLike | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const normalizedName = name.toLowerCase();

  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return headers.get(normalizedName) ?? undefined;
  }

  const record = headers as Record<string, HeaderValue>;
  const direct = record[normalizedName] ?? record[name];

  if (Array.isArray(direct)) {
    return direct[0];
  }

  return typeof direct === 'string' ? direct : undefined;
}

function extractClientIp(headers: HeadersLike | undefined): string {
  const candidates = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

  for (const key of candidates) {
    const raw = resolveHeader(headers, key);
    if (!raw) continue;
    if (key === 'x-forwarded-for') {
      const [first] = raw.split(',');
      if (first && first.trim()) return first.trim();
    } else {
      return raw.trim();
    }
  }

  return 'unknown';
}

function extractPath(url: string | null | undefined): string {
  if (!url) return DEFAULT_PATH;

  try {
    return new URL(url, 'http://localhost').pathname || DEFAULT_PATH;
  } catch {
    return url;
  }
}
