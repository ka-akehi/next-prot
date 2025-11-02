# フェーズ 2-1 — アカウント単位レートリミット実装計画

## 背景と目的

- 既に IP 単位のレートリミットと Slack 通知が整備されているが、特定アカウントを狙ったクレデンシャルスタッフィングや辞書攻撃に対しては十分ではない。
- Prisma の `loginAttempts` と `lockedUntil` による固定しきい値ロックは存在するが、分散攻撃時には検知が遅く、ロック解除タイミングも柔軟に調整できない。
- Redis を用いたアカウント単位の失敗カウントと指数バックオフを導入し、同一アカウントに対する連続失敗を迅速に減速させることが目的。

## 実装ポリシー

1. **Redis を単一ソースとする**
   - `rate:account:failures:{userId|normalizedEmail}` の Sorted Set に失敗タイムスタンプを保持し、ウィンドウ外のデータを都度削除する。
   - `rate:account:lock:{identifier}` は現在のバックオフ状態を、`rate:account:penalty:{identifier}` は累積ペナルティの有効期間を表す。
   - Prisma 側の `loginAttempts` / `lockedUntil` は一時的に併存しつつ、最終的にはバックアップ用途に限定。
2. **指数バックオフと累積ペナルティの設計**
   - 例: `retryAfter = min(baseWindow * 2^(failCount - threshold), maxWindow)`。
   - 最大ロック時間（例: 3600 秒）に達したらペナルティキーをセットし、TTL は 12 時間と `ACCOUNT_RATE_LIMIT_PENALTY_TTL` の短い方に揃える。ペナルティ中に失敗が続いた場合はその都度同じ値で貼り直す。
   - ペナルティは最大 12 時間継続し、それ以降は通常カウントへ復帰する。
3. **レートリミット結果を統一エラーコードへマッピング**
   - バックオフ発動時は `AuthAttemptResult` を `locked` または `rate-limited` として `AUTH_ERROR_CODES.TooManyRequests` を返却。
   - ログ (`logs/auth-attempts.log`) には `context.retryAfterSeconds` などを含めて解析性を高める。
4. **冪等性とフェイルオーバー**
   - Redis に接続できない場合は安全側に倒し、既存の Prisma ロジックにフォールバック。
   - レートリミット判定は API / middleware のどちらからも一貫したロジックを呼び出す。

## 具体的なステップ

1. **設定値とキー設計の確定**
   - `.env` に `ACCOUNT_RATE_LIMIT_THRESHOLD`, `ACCOUNT_RATE_LIMIT_BASE_WINDOW`, `ACCOUNT_RATE_LIMIT_MAX_WINDOW`, `ACCOUNT_RATE_LIMIT_PENALTY_TTL` を定義。
   - Redis キー例: `rate:account:failures:${identifier}`, `rate:account:lock:${identifier}`, `rate:account:penalty:${identifier}`。
   - IaC / オペレーションチームと連携し、本番環境の Redis リソース要件を再確認。
2. **計算ロジックの実装**
   - `src/server/rate-limit` 配下に `account-rate-limiter.ts` を新設。
   - `enforceAccountRateLimit(userKey)` で現在の失敗回数、バックオフ待機時間、残り試行回数を返す。
   - 例: `count >= threshold` の場合に `retryAfterSeconds = min(base * 2^(count - threshold), max)` を算出。
3. **認証処理との統合**
   - `src/helpers/auth.helpers.ts` の `verifyPasswordOrThrow` へ統合。
   - 認証直前に `enforceAccountRateLimit` を呼び出し、`allowed === false` の場合は直ちに `AUTH_ERROR_CODES.TooManyRequests` を投げる。
   - パスワード失敗時には `incrementAccountFailure`、成功時には `resetAccountFailure` を呼び出す。
   - 既存の `loginAttempts` 更新は削除するか、Redis 不達時のフォールバックのみ残す。
4. **ログとアラートの拡充**
   - `logAuthAttempt` に `context` で `accountRateLimit: { retryAfterSeconds, consecutiveFailures }` を付与。
   - Slack 通知テンプレートを更新し、アカウント単位のバックオフ発動を識別できるようにする（例: メッセージにユーザー識別子と待機時間を含める）。
5. **テストと検証**
   - ユニットテスト: `account-rate-limiter` ロジックの境界値、指数計算、TTL リセットの検証。
   - 結合テスト: 実際にログイン API を叩いてバックオフ → 成功 → リセットを確認（jest の e2e もしくは Cypress で再現）。
   - 負荷テスト: Redis キーの TTL と削除が期待通りか、並列アクセス時の `multi`/`watch` 競合が無いか確認。
6. **移行とロールアウト**
   - 本番前に既存ユーザーの `loginAttempts`/`lockedUntil` をリセットし、Redis キー未作成状態から開始。
   - 段階的なリリース: ステージング環境で 429 レスポンスと Slack 通知を確認後、本番へ展開。
   - ローンチ後 1〜2 週間はアラート閾値とバックオフパラメータを観察し、運用チームと調整。

## 残タスクと関連依存

- **CAPTCHA / Pwned Passwords**: 同フェーズ内で後続の実装が控えているため、共通で利用する Redis キー命名やログ構造は拡張性を意識する。
- **レートリミット統計の可視化**: 既存の失敗メトリクスに `accountRateLimitTriggered` カウンタを追加し、攻撃傾向を Analytics/BI に連携する。
- **ドキュメント更新**: 完了後に `brute-force-attack.md` と運用 Runbook（Slack 通知対応手順など）を更新する。
