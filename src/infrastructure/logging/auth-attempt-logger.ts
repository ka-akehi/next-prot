import type { AuthAttemptLog, AuthAttemptResult } from '@/types/auth-attempt-log';
import { extractClientIpFromHeaders, resolveHeader, type HeadersLike } from '@shared/network/extract-client-ip';
import fs from 'node:fs';
import path from 'node:path';

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
    timestamp: new Date().toISOString(),
    ip: extractClientIpFromHeaders(headers),
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

function extractPath(url: string | null | undefined): string {
  if (!url) return DEFAULT_PATH;

  try {
    return new URL(url, 'http://localhost').pathname || DEFAULT_PATH;
  } catch {
    return url;
  }
}
