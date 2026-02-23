# 技術スタック

## バージョン方針
- 全技術スタックは作成時点（2026年2月）の最新安定版を使用

## フロントエンド

### Web版 (frontend/web)
- **フレームワーク**: Svelte v5.49.0
- **ビルドツール**: Vite
- **リアルタイム通信クライアント**: Socket.IO Client v4.8.3
- **ターゲット**: モダンWebブラウザ（Chrome, Firefox, Safari, Edge）
- **デザイン**: レスポンシブデザイン
- **言語**: TypeScript

### モバイル版 (frontend/mobile)
- **フレームワーク**: Flutter v3.38.6
- **言語**: Dart
- **リアルタイム通信クライアント**: Socket.IO Client (Dart) / web_socket_channel パッケージ
- **ターゲットOS**: iOS, Android
- **状態管理**: Riverpod

## バックエンド
- **ランタイム**: Node.js v24.13.0 LTS "Krypton"
- **フレームワーク**: Hono v4.11.8
- **リアルタイム通信**: Socket.IO v4.8.3
- **言語**: TypeScript
- **データベース**: Supabase（PostgreSQL）
- **ORM**: Drizzle ORM + drizzle-kit（マイグレーション）
- **キャッシュ/キュー**: Redis（マッチング待機キュー用）

## 主要ライブラリ・パターン

### エラーハンドリング
- **neverthrow** (`Result<T, E>` 型): `throw`を使わず、エラーを値として返す
- エラーは `ok()` / `err()` で表現、呼び出し元が `match` / `map` / `andThen` で処理

### バリデーション
- **zod**: スキーマ定義とランタイムバリデーション（主にWebSocketペイロード検証）

### テスト
- **vitest**: バックエンド・フロントエンドともに統一のテストフレームワーク

### 共有型
- **@cha-chat/shared-types** (workspace): フロント・バックエンド共通のWebSocketイベント型

## 主要技術要件

### リアルタイム通信
- WebSocketを使用して双方向通信を実現
- メッセージの即時配信
- チャットルーム状態の同期

### データベース・インフラ実装
- Supabase（PostgreSQL）: チャットルーム、メッセージ、セッション管理（10分間のみ保持、pg_cronで削除）
- Redis: マッチング待機キュー
- **現在の開発状態**: InMemory実装（`InMemorySessionManager`, `InMemoryRoomManager` 等）で先行開発中。本番はSupabase/Redis実装に切り替え予定

## 開発環境
- パッケージマネージャー: pnpm
- リンター/フォーマッター: Biome
- モノレポツール: pnpm workspace
