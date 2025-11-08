# アカウント単位レートリミット実装メモ

対象ファイル: `src/server/rate-limit/account-rate-limiter.ts`

## 実装のキーポイント

- アカウント識別子は `setupRateLimiter` 内でトリム済み文字列に正規化され、空文字列は例外になる。
- 直近 `ACCOUNT_RATE_LIMIT_HISTORY_WINDOW` 秒の失敗は `rate:account:failures:{identifier}` **Sorted Set** に `timestamp:suffix` 形式で保存。`getRecentFailureCount` で期限切れスコアを削除し、件数が 0 件ならキーも消す（デフォルト 24 時間分保持）。
- ロック状態は `rate:account:lock:{identifier}`（値は `locked` 固定）の TTL で表現。`ensureLockTtl` が TTL の延長／短縮をまとめて扱う。
- 長期的な抑止用に `rate:account:penalty:{identifier}` を別キーで保持。`computePenaltyTargetSeconds` が `ACCOUNT_RATE_LIMIT_PENALTY_TTL` と 12 時間の短い方を計算し、最低 1 秒は保証する。ペナルティ中に失敗が発生した場合は TTL を常にこの値（最大 12 時間）まで貼り直す。
- API の戻り値は `allowed`, `retryAfterSeconds`, `remaining`, `consecutiveFailures`, `threshold` を含む共通構造 (`buildResult`)。

## 主な環境変数

- `ACCOUNT_RATE_LIMIT_THRESHOLD`: 連続失敗の許容回数。
- `ACCOUNT_RATE_LIMIT_BASE_WINDOW`: 閾値超過直後の待機秒（指数バックオフの基準値）。
- `ACCOUNT_RATE_LIMIT_HISTORY_WINDOW`: 失敗履歴を保持する時間窓（秒）。`ACCOUNT_RATE_LIMIT_MAX_WINDOW` 以上である必要があり、デフォルトは 24 時間。
- `ACCOUNT_RATE_LIMIT_MAX_WINDOW`: 指数バックオフとロック TTL の上限（秒）。
- `ACCOUNT_RATE_LIMIT_PENALTY_TTL`: ペナルティ継続の最大秒数。`maxWindowSeconds` より小さく設定された場合でも起動時に自動で引き上げられる。

## フロー

1. **検証開始 (`enforceAccountRateLimit`)**

   - Redis クライアントと設定を取得。

- ロック／ペナルティの TTL を同時取得し、失敗カウントは `getRecentFailureCount` で最新状態に整理。
  - ペナルティ中でもロック TTL が 0 に落ちていれば新たなロックは張らず、`allowed: true` を返す（正しい認証情報ならそのまま成功させる）。
  - ペナルティ中かつロック TTL が残っている場合は、`ensurePenaltyTtl` でペナルティ TTL を現在設定値（最大 12 時間）より長くならない範囲で維持しつつ、`ensureLockTtl(..., allowDecrease=true)` でロック TTL を常に `maxWindowSeconds`（既定 3600 秒）に戻す。
- ペナルティ外ではロック TTL をそのまま返し、0 秒であれば `allowed: true`。

2. **失敗記録 (`recordAccountFailure`)**

   - 失敗ウィンドウ外（`historyWindowSeconds` 超え）のデータを削除、現在時刻＋ランダムサフィックスでエントリを追加し、Sorted Set の TTL を `historyWindowSeconds`（既定 24 時間）に更新。

- ペナルティ中でロックが残っていれば、毎回 `maxWindowSeconds`（既定 3600 秒）までロック TTL を戻し、ペナルティ TTL も 12 時間以内の設定値に貼り直す。
- ペナルティ中でロックが切れていた場合は、今回の失敗を機にロックを張り直し（= 3600 秒）しつつ、ペナルティ TTL も再度 12 時間以内の値に設定する。
- ペナルティ外で閾値を超えた場合は `calculateBackoffSeconds` で指数バックオフを算出し、その値でロック TTL を更新。結果が `maxWindowSeconds` に達したタイミングで初めてペナルティキーをセットし、ロックも 3600 秒に揃える。
- 最終的にペナルティが有効な場合は `threshold + 1` として扱い、戻り値は常に「残り 0 回」を示す。

3. **成功処理 (`resetAccountRateLimit`)**
   - 失敗履歴・ロック・ペナルティの 3 キーを削除し、状態を完全リセットする。

## 主なヘルパー

- `setupRateLimiter(identifier)`: 正規化済み識別子・Redis クライアント・設定値をまとめて取得。
- `calculateBackoffSeconds(failures, config?)`: 閾値超過分に指数バックオフ (`base * 2^(excess-1)`) を適用し、`maxWindowSeconds` を上限にする。
- `buildResult(config, failures, retryAfterSeconds)`: フロント側で再利用できる共通レスポンスを作成し、`remaining` は 0 未満にならないようクリップ。
- `ensureLockTtl(client, lockKey, ttlSeconds, allowDecrease)`: TTL を延長・短縮・新規セットする。`allowDecrease=true` ならペナルティ中の短縮も許可。
- `ensurePenaltyTtl(client, penaltyKey, ttlSeconds, allowIncrease?)`: ペナルティ TTL を現在時点から見た残り時間に合わせる。延長させたくない場合は `allowIncrease=false` を渡す。0 以下になった場合はキーを削除。
- `computePenaltyTargetSeconds(maxSeconds)`: `ACCOUNT_RATE_LIMIT_PENALTY_TTL` と 12 時間の短い方を計算し、1 秒未満にならないよう補正。
- `randomSuffix()`: Sorted Set エントリにユニーク性を持たせる 10 文字のランダム文字列を生成。
- `build{Failures|Lock|Penalty}Key(identifier)`: Redis キー命名を共通化。

## 運用のコツ

- 認証前に `enforceAccountRateLimit` を呼び、`allowed` が `false` の場合は早期にリクエストを遮断する。
- 失敗時には `recordAccountFailure` の戻り値からペナルティ状態や待機秒をログ・通知へ流す。
- 成功時には `resetAccountRateLimit` を必ず呼んで、誤ロックを防ぐ。
