# アカウント単位レートリミット実装メモ

対象ファイル: `src/server/rate-limit/account-rate-limiter.ts`

## 構造の概要

- 直近 `ACCOUNT_RATE_LIMIT_BASE_WINDOW` 秒の失敗履歴は `rate:account:failures:{identifier}` という **Sorted Set** に時刻（Unix ms）付きで保存される。各失敗で古いスコアを除去し、ウィンドウ内の件数を `zCard` で取得する。
- しきい値を超えた際は `rate:account:lock:{identifier}` というキーに EX 付きでロックを張り、TTL が残っている間はログインを拒否する。
- 最大ロック時間（`ACCOUNT_RATE_LIMIT_MAX_WINDOW`）に達した場合は `rate:account:penalty:{identifier}` を設定し、TTL は「JST の次回 0:00 まで」と `ACCOUNT_RATE_LIMIT_PENALTY_TTL` の短い方に揃えられる。ペナルティ期間中はロック TTL も同じ時間幅に強制され、日付が変わると自動解除される。
- 戻り値は `allowed`, `retryAfterSeconds`, `remaining`, `consecutiveFailures`, `threshold` を含む共通構造。

## 主な環境変数

- `ACCOUNT_RATE_LIMIT_THRESHOLD`: ペナルティ開始前に許容する連続失敗回数。
- `ACCOUNT_RATE_LIMIT_BASE_WINDOW`: 連続失敗を集計する時間窓（秒）。
- `ACCOUNT_RATE_LIMIT_MAX_WINDOW`: 指数バックオフの上限（秒）。
- `ACCOUNT_RATE_LIMIT_PENALTY_TTL`: ペナルティ状態を維持する最大期間（秒）。実際の TTL は JST の次回 0:00 までの残り秒数との短い方。

## 関数ごとの役割

### `enforceAccountRateLimit(identifier)`

- 認証開始時に呼び、ロックキーの TTL を確認。
- 併せて Sorted Set から期限切れデータを掃除して最新の連続失敗数を取得。
- ペナルティキーが残っている場合は、JST の次回 0:00 までの残り秒数（と `ACCOUNT_RATE_LIMIT_PENALTY_TTL` の短い方）を再計算し、その値でロック TTL を上書きする。
- 最終的なロック / ペナルティの状態に応じて `allowed` / `retryAfterSeconds` を判定する。

### `recordAccountFailure(identifier)`

- 認証失敗時に呼ぶ。
- Sorted Set からウィンドウ外の時刻を削除 → 現在時刻で要素追加 → TTL を（ベースウィンドウと最大バックオフの大きい方で）更新。
- 最新の件数を `zCard` で取得し、しきい値超えなら指数バックオフ秒を計算。
- 最大バックオフに到達したらペナルティキーをセットし、TTL は「JST 次回 0:00 まで」と `ACCOUNT_RATE_LIMIT_PENALTY_TTL` の短い方に揃える。
- ペナルティ有効時は、失敗回数が閾値未満でも即座に同じ TTL でロックを維持し、日付が変わると解除される。

### `resetAccountRateLimit(identifier)`

- 認証成功時に呼び出し、失敗履歴・ロックキー・ペナルティキーをまとめて削除し、クールダウン状態を解除する。

### `calculateBackoffSeconds(failures, config)`

- しきい値超過分について `baseWindowSeconds * 2^(failures - threshold - 1)` で指数的に待機秒を算出し、`maxWindowSeconds` を上限とする。

### `buildResult(config, failures, retryAfterSeconds)`

- 呼び出し元に返す共通レスポンスを組み立てる。
- `remaining` は負数にならないよう `0` で下限を揃え、`allowed` は `retryAfterSeconds` が 0 以下かで判断。

### `getRecentFailureCount(client, identifier, windowSeconds)`

- Sorted Set からウィンドウ外のスコアを削除し、最新のエントリ数を返すヘルパー。
- エントリが 0 件になった場合はキーも削除。

### `getLockTtlSeconds(client, identifier)` / `ensureLockTtl(client, lockKey, ttlSeconds, allowDecrease)`

- ロックキーの TTL を取得、または必要に応じて更新するためのヘルパー。
- `allowDecrease` を `true` にすると、ペナルティ中などでロック TTL を短縮（例: 深夜 0:00 までに合わせる）する。

### `getPenaltyTtlSeconds(client, identifier)` / `ensurePenaltyTtl(client, penaltyKey, ttlSeconds)`

- ペナルティキーの TTL を確認・更新するヘルパー。TTL は JST の次回 0:00 までを上限に保ち、日付を跨ぐと自然に解除される。

### `computePenaltyTargetSeconds(maxSeconds)` / `secondsUntilNextJstMidnight(now)`

- ペナルティ TTL を算出するヘルパー。`ACCOUNT_RATE_LIMIT_PENALTY_TTL` と JST の次回 0:00 までの残り時間を比較して短い方を返す。

### `buildFailuresKey(identifier)` / `buildLockKey(identifier)` / `buildPenaltyKey(identifier)` / `normalizeIdentifier(identifier)`

- キー生成と入力検証の共通化。空文字列は許容せず早期に例外を投げる。

## 利用の流れ

1. 認証開始時に `enforceAccountRateLimit` を呼び、`allowed` が `false` なら即座に 429 等で弾く。
2. パスワード検証などが失敗した場合は `recordAccountFailure` を実行し、戻り値の `retryAfterSeconds` やペナルティ状態をログ／通知へ送る。
3. 認証成功時に `resetAccountRateLimit` を呼び、失敗履歴・ロック・ペナルティをクリアする。

最大ロックに到達したアカウントは `ACCOUNT_RATE_LIMIT_PENALTY_TTL` の間、再び 3600 秒ロックが連続して適用されるため、長期的なクレデンシャルスタッフィングや辞書攻撃に対して強力な抑止力を発揮しつつ、十分な期間を経た後のみ通常状態へ復帰できる。
