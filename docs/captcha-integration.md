# reCAPTCHA v3 連携実装ステップ

フェーズ 2-2 の CAPTCHA 連携を reCAPTCHA v3 で行う手順を整理する。v3 はウィジェットを表示せず、JavaScript 経由でアクションごとにトークンを取得してサーバーで検証する。

## 1. 前提確認

- `AccountRateLimitResult` から `consecutiveFailures` / `threshold` を取得できる状態であること。
- 失敗回数が `threshold` 以上になったら CAPTCHA を強制する仕様で統一する。

## 2. 設定とシークレット管理

1. reCAPTCHA 管理画面 (https://www.google.com/recaptcha/admin) で v3 のサイトを登録し、サイトキーとシークレットキーを取得。
2. `.env` に以下を追加し、本番・ステージングでも値を用意する。
   ```
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key
   RECAPTCHA_SECRET_KEY=your-secret-key
   RECAPTCHA_SCORE_THRESHOLD=0.5
   ```
3. `next.config.ts` などで `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` をクライアントへ渡せるようにする。

## 3. トリガー条件の露出

1. `createRateLimitPipeline` の結果から `consecutiveFailures` と `threshold` を返す API (`/api/auth/rate-limit/status`) を用意。
2. フロントエンドはログインフォームでメールアドレスを入力したタイミングでこの API を叩き、`consecutiveFailures >= threshold` のとき `captchaRequired=true` を表示状態に反映。

## 4. フロントエンド実装

1. `npm install react-google-recaptcha-v3` を実行し、`GoogleReCaptchaProvider` / `useGoogleReCaptcha` を利用できるようにする。
2. ログインページを `GoogleReCaptchaProvider` でラップし、`captchaRequired` が true のときに `executeRecaptcha('login_submit')` を呼んでトークンを取得。
3. トークンは資格情報ログイン呼び出しに同梱し、未取得の場合は送信を止めてエラーメッセージを表示。
4. サイトキー未設定時は警告を表示し、レートリミットのトリガー条件が止まることを明示する。

## 5. サーバー側検証

1. ログイン API (`authorize`) で `captchaToken` を受け取り、CAPTCHA 必須の場合のみ検証を実施。
2. 検証例:

   ```ts
   const verifyResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
     method: 'POST',
     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
     body: new URLSearchParams({
       secret: process.env.RECAPTCHA_SECRET_KEY!,
       response: captchaToken,
       remoteip: requestIp,
     }),
   }).then((res) => res.json());

   if (!verifyResponse.success || verifyResponse.score < 0.5) {
     throw new AuthError(AUTH_ERROR_CODES.TooManyRequests, 'captcha_failed');
   }
   ```

3. 失敗した場合は `recordAccountFailure` を呼んで連続失敗を増やし、同じエラーコードを返却して再入力を促す。

## 6. ログ・モニタリング

- `logAuthAttempt` の `context` に `captchaRequired`, `captchaSolved`, `recaptchaScore` などを追加し、Slack 通知でも確認できるようにする。
- reCAPTCHA サイトの管理コンソールでスコア推移を監視し、しきい値が適切かどうかを定期的に確認する。

## 7. テスト

1. 単体テスト: CAPTCHA 必須判定ヘルパー、`authorize` 内の検証分岐、スコアしきい値の扱いを Jest で確認。
2. E2E: reCAPTCHA のテストキー（常に成功/失敗を返すもの）を使い、Cypress/Jest E2E で `consecutiveFailures >= threshold` のシナリオを再現。
3. 手動確認: 開発環境で閾値を 1〜2 に下げ、連続失敗 → CAPTCHA 強制 → 成功時リセットまでの流れを確認。

## 8. ロールアウト

1. ステージングで 429 レスポンス／ログ出力を確認後、本番へデプロイ。
2. 初期段階は `consecutiveFailures` の閾値や `verifyResponse.score` のしきい値を緩めに設定し、誤検知がないか監視。
3. 運用上問題なければ順次しきい値を強化し、攻撃傾向に応じてしきい値をチューニングする。
