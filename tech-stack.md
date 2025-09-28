# 技術スタック概要

## アプリケーション基盤
- **Next.js 15.3.5**（App Router、`app/` ディレクトリ構成）とカスタムサーバーでアプリ全体を構築（`package.json`, `server/index.ts`）
- **React 19 / React DOM 19** を UI レイヤーに採用（`package.json`）
- **TypeScript 5 系** による静的型付け（`tsconfig.json`）
- **tsx** を使った Node.js ランタイム起動で Next.js と WebSocket サーバーを統合（`package.json` の `dev` スクリプト）
- **Next.js Middleware** によるルートガードと 2FA フロー制御（`middleware.ts`）

## フロントエンド & UI
- **Tailwind CSS 4** + **PostCSS** によるユーティリティファーストなスタイリング（`tailwind.config.js`, `postcss.config.mjs`）
- **Heroicons** や **Recharts** を用いた UI コンポーネント／データ可視化（`package.json`）
- **Gray-matter** + **remark/remark-html** による Markdown コンテンツのパースと描画（`package.json`, `content/` 配下）
- **DOMPurify / isomorphic-dompurify** で動的 HTML をサニタイズし、XSS を防止（`package.json`）

## バックエンド & API
- **Next.js API Routes**（`app/api/`, `pages/api/`）で RESTful エンドポイントを提供
- **カスタム HTTP + WebSocket サーバー**（Node.js `http` + `ws`）でリアルタイム機能を提供（`server/index.ts`, `server/chat-ws-handler.ts`, `server/export-ws-handler.ts`）
- **csv-stringify** などのユーティリティでデータエクスポート機能を実装（`server/export-worker.ts`）

## 認証・セキュリティ
- **NextAuth.js 4** と **@next-auth/prisma-adapter** によるセッション管理（`app/api/auth/[...nextauth]/route.ts` ほか）
- **TOTP 二要素認証** を **otplib** + **qrcode** で実装（`app/2fa/`, `middleware.ts`）
- **web-push** による PWA プッシュ通知の送信と購読管理（`app/api/pushNotice/route.ts`, `scripts/send-push.ts`）
- **Content-Security-Policy ヘッダー** による追加防御策（`next.config.ts`）

## データ層
- **Prisma ORM 6** によるスキーマ駆動開発とクエリ生成（`prisma/schema.prisma`）
- 既定は **SQLite** を `DATABASE_URL` で指定（`prisma/schema.prisma`）
- Prisma CLI を用いたマイグレーション／クライアント生成（`package.json` の `prisma:*` スクリプト）

## テスト & 品質
- **Jest 30 + ts-jest** でユニットテスト／スナップショットテストを実施（`jest.config.ts`, `__tests__/` 配下）
- **Testing Library**（React + User Event）と **jest-dom** によるコンポーネント検証（`jest.setup.ts`）
- **Cypress 14** で E2E テストを実行し、`start-server-and-test` フローで自動起動（`package.json` の `test:e2e` スクリプト）
- **ESLint 9** + **eslint-config-next** による静的解析とスタイル統一（`eslint.config.mjs`）

## 補助ツール / その他
- **dotenv** で環境変数をロードしローカル開発を支援
- **uuid**, **path**, **fs** など標準ユーティリティで補助処理
- 自動生成コードや API クライアントを配置した `generated/`, `lib/`, `models/`, `view_model/` ディレクトリ群
- `scripts/` 配下にプッシュ通知送信など運用スクリプトを準備
