export type AuthAttemptResult =
  | 'success'
  | 'invalid-credentials'
  | 'locked'
  | 'rate-limited'
  | 'mfa-required'
  | 'error';

export interface AuthAttemptLog {
  /** ISO-8601形式のUTC日時文字列 */
  timestamp: string;
  /** リクエストから取得した IPv4/IPv6 文字列 */
  ip: string;
  /** 正規化済みの識別子（未指定なら null） */
  username: string | null;
  /** リクエストパス（例: `/api/auth/login`） */
  path: string;
  /** 生のユーザーエージェント文字列 */
  userAgent: string;
  /** 認証試行の結果 */
  result: AuthAttemptResult;
  /** 失敗時の理由やロック理由 */
  reason?: string;
  /** 任意のリクエスト相関 ID */
  requestId?: string;
  /** 追加の構造化情報（地理情報やデバイスフィンガープリントなど） */
  context?: Record<string, unknown>;
}

export const AUTH_ATTEMPT_LOG_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://next-prot/schemas/auth-attempt-log.json',
  type: 'object',
  required: ['timestamp', 'ip', 'username', 'path', 'userAgent', 'result'],
  additionalProperties: false,
  properties: {
    timestamp: { type: 'string', format: 'date-time' },
    ip: { type: 'string' },
    username: { type: ['string', 'null'], minLength: 0 },
    path: { type: 'string' },
    userAgent: { type: 'string' },
    result: {
      type: 'string',
      enum: ['success', 'invalid-credentials', 'locked', 'rate-limited', 'mfa-required', 'error'],
    },
    reason: { type: 'string' },
    requestId: { type: 'string' },
    context: { type: 'object' },
  },
} as const;

export function isAuthAttemptLog(value: unknown): value is AuthAttemptLog {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.timestamp === 'string' &&
    typeof candidate.ip === 'string' &&
    (typeof candidate.username === 'string' || candidate.username === null) &&
    typeof candidate.path === 'string' &&
    typeof candidate.userAgent === 'string' &&
    typeof candidate.result === 'string'
  );
}
