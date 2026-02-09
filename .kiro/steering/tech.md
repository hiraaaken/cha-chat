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
- **データベース**: MongoDB
- **ドライバー**: MongoDB Node.js Driver v7.1.0
- **キャッシュ/キュー**: Redis（マッチング待機キュー用）

## 主要技術要件

### リアルタイム通信
- WebSocketを使用して双方向通信を実現
- メッセージの即時配信
- チャットルーム状態の同期

### データベース
- MongoDB を使用
- チャットルーム情報の管理
- メッセージの一時保存（10分間のみ）
- 匿名ユーザーセッション管理

## 開発環境
- パッケージマネージャー: pnpm
- リンター/フォーマッター: Biome
- モノレポツール: pnpm workspace
