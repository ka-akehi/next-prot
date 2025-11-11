# フェーズ2-3: Pwned Passwords 連携によるクレデンシャル・スタッフィング耐性強化

登録・パスワード変更時に既知漏えいハッシュを遮断し、漏えい済み資格情報を基点としたクレデンシャル・スタッフィングを未然に防ぐ手順。

## 1. 仕様としきい値を決める

1. 参照 API は HIBP Pwned Passwords の k-Anonymity Range API（`https://api.pwnedpasswords.com/range/{SHA1_PREFIX}`）。
2. 5 文字の SHA-1 先頭ハッシュを送信し、レスポンス内のサフィックス一覧から一致件数を取得する。
3. `PWNED_PASSWORD_MAX_COUNT`（例: 1〜10 件）を決め、件数が閾値を超えた場合は拒否・アラート。
4. フラグ `PWNED_PASSWORD_VALIDATION_ENABLED` を `.env` / `next.config.ts` で切り替え可能にする（CI やローカルで外せるようにする）。

## 2. サーバーサイドのヘルパーを実装

1. `src/server/security/pwned-password.ts`（など）を新規作成し、以下を提供:
   - `hashPasswordToSha1(password: string): string` … UTF-8 → SHA-1 → 大文字 40 桁。
   - `fetchPwnedPasswordSuffixes(prefix: string): Promise<Map<string, number>>` … Range API を叩き、`suffix => count` を返す。
   - `checkPwnedPassword(password: string): Promise<{ compromised: boolean; count: number }>` … 上記2つを組み合わせ、閾値判定。
2. `fetch` リクエストには `Add-Padding: true` ヘッダを付与し、レスポンスに擬似パディングを含めることで長さからの推測を防ぐ。
3. タイムアウトや 429 対策として、`AbortController` + 1〜2 秒のリトライ（指数バックオフ）を実装し、失敗時は安全側（検証エラー扱い）に倒す。
4. 失敗・成功ともに `console.warn('pwned-password', …)` でコンテキスト（email, ip を含まない匿名情報）を残し、SIEM で観測できるようにする。

## 3. ドメインメッセージとコンフィグを拡張

1. `src/domain/messages/error.messages.ts` の `PASSWORD_ERROR_MESSAGES` に `pwnedPassword`（例: 「過去に漏えいしたパスワードは利用できません」）を追加。
2. `src/server/config` などに `getPwnedPasswordConfig()` を定義し、`enabled` / `maxCount` / `timeoutMs` / `apiBaseUrl` を返す。
3. `.env.example` / `.env` に `PWNED_PASSWORD_MAX_COUNT=1` や `PWNED_PASSWORD_TIMEOUT_MS=2000` を記載して周知。

## 4. 登録・パスワード系 API へ組み込む

1. `app/api/auth/register/route.ts`
   - 既存の長さ・複雑度チェックの直後に `checkPwnedPassword(password)` を呼ぶ。
   - `compromised` が `true` なら `PASSWORD_ERROR_MESSAGES.pwnedPassword` を返し、HTTP 400。
   - レスポンスには `count` を含めず、内部ログ (`console.warn` or `logSecurityEvent`) のみに残す。
2. `app/api/auth/password/route.ts`（ログイン済みユーザーの変更 API）
   - 新パスワード検証の中で同じヘルパーを呼び出し、拒否時は現行パスワードの比較前に即座に終了。
   - ユーザーが `currentPassword` を誤入力した場合と区別できるよう、別エラーメッセージを返す。
3. `app/api/auth/password/setup/route.ts`
   - パスワード初期設定でも同じチェックを実施し、既知漏えいパスワードを禁止する。

## 5. UI へのフィードバック

1. `use-register-view-model` とパスワード設定フォームで `pwnedPassword` メッセージを拾い、通常のバリデーション結果と同じ場所に表示。
2. メッセージには「別のパスワードを選択してください」「パスワードマネージャのランダム生成を推奨」などの案内を加える。
3. ローカルテスト用に `NEXT_PUBLIC_DEBUG_ALLOW_PWNED_PASSWORDS` などのフラグを設ける場合は、UI でも警告を出す。

## 6. テスト & モニタリング

1. ユニットテスト:
   - `hashPasswordToSha1` が期待どおり大文字 SHA-1 を返すか。
   - モックした Range API レスポンスに応じて `compromised` 判定が変わるか。
   - タイムアウト／HTTP エラー時に安全側エラーが返るか。
2. API テスト:
   - `register` / `password` ルートで `P@ssw0rd` など既知漏えい値を入力し、400 と専用メッセージが返るかを E2E で確認。
   - 正常系では HIBP 呼び出しをスタブして 201/200 を確認。
3. モニタリング:
   - Pwned 判定が連続した場合にセキュリティチームへ通知（Slack Hook や SIEM アラート）を設定。
   - レート超過や API 障害に備え、`checkPwnedPassword` の例外発生数をメトリクス化。

## 7. デプロイとフォローアップ

1. 新しい環境変数をステージング → 本番へ反映し、デプロイ前に Feature Flag で無効化できる状態を確認。
2. ステージングで漏えいパスワード（例: `password123`）を入力し、UI・API が期待どおり拒否するかを確認。
3. 本番リリース後 1〜2 週間はアラート件数や CS 問い合わせをモニタリングし、閾値の調整やメッセージ改善を検討する。
