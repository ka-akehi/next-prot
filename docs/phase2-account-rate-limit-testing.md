# フェーズ 2 アカウントレートリミット 動作確認手順

## 前提

- リポジトリ直下で作業する。
- `.env` に `REDIS_URL`、`RATE_LIMIT_SECRET` など必要な環境変数が設定されていること。
- Redis サーバーが起動していること（ローカルなら `redis-server`、Docker なら `docker compose up redis` 等）。

## 1. ユニットテストで基礎動作を確認

```bash
npm test -- __tests__/auth/verify-password-or-throw.test.ts
```

- `verifyPasswordOrThrow` が Redis 利用時とフォールバック時の両方で期待通りに動作するかを自動検証。
- ここで失敗した場合はロジック修正より先にテストを解消する。

## 2. 手動で連続失敗 → レートリミット発動を確認

1. アプリを起動する。  
   `npm run dev`
2. ログイン画面から存在するアカウントで意図的に誤ったパスワードを送信する。  
   - 目安: `ACCOUNT_RATE_LIMIT_THRESHOLD` 回までは `CredentialsSignin`、超過すると `TooManyRequests` が返る。
3. `logs/auth-attempts.log` に `result: "rate-limited"`、`context.accountRateLimit.retryAfterSeconds` が記録されることを確認する。  
   - `tail -f logs/auth-attempts.log`
4. `redis-cli` 等で `rate:account:failures:*` / `rate:account:lock:*` キーが作成され、TTL が設定されていることを確認する。  
   ```bash
   redis-cli keys "rate:account:*"
   redis-cli ttl rate:account:lock:{identifier}
   ```
- 最後に UI 上で `アクセスが集中しています…` のエラーメッセージが表示されるか目視する。

## 3. 正常ログインで状態がリセットされることを確認

1. 同じアカウントで正しいパスワードを入力し、ログイン成功させる。
2. `redis-cli` で対象ユーザーの `rate:account:*` キーが削除されていることを確認する。  
   `redis-cli keys "rate:account:*"`
3. `logs/auth-attempts.log` に `result: "success"` が追加され、`retryAfterSeconds: 0` になっていることを確認する。

## 4. Redis 障害時のフォールバック確認（任意）

1. Redis を停止する。  
   例: Docker 利用時 `docker compose stop redis`
2. 誤ったパスワードでログインを試行し、`CredentialsSignin` が返ることを確認する。  
   - 429 が返らず通常のエラーに落ちる。
3. サーバーログにフォールバック利用のログ (`[auth] failed to enforce account rate limit`) が出力されることを確認する。
4. Redis を再起動し、連続失敗 → レートリミット発動が再び使えることを再確認する。

## 5. 片付け

- `npm run dev` を終了する。
- 停止していた Redis を再起動しておく、または不要であれば停止する。
