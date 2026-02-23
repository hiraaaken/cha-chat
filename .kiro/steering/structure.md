# プロジェクト構成

## モノレポ構成

このプロジェクトはpnpm workspaceで管理されるモノレポ。

```
cha-chat/
├── frontend/
│   ├── web/              # Webブラウザ版フロントエンド（Svelte）
│   └── mobile/           # モバイルアプリ版フロントエンド（Flutter）
├── backend/              # バックエンドアプリケーション（Hono + Socket.IO）
├── packages/
│   └── shared-types/     # フロント・バックエンド共通の型定義
└── tests/                # 統合テスト・E2Eテスト
```

## バックエンド構成（DDD レイヤー）

`backend/src/` はDomain-Driven Designで3層に分離:

```
backend/src/
├── domain/           # 純粋なビジネスロジック（副作用なし）
│   ├── entities/     # チャットルーム、メッセージ、セッション等
│   ├── events/       # ドメインイベント定義
│   └── types/        # 値オブジェクト（RoomId, SessionId 等）、エラー型
├── application/      # ユースケース・ワークフロー
│   ├── interfaces/   # インフラへの依存インターフェース
│   ├── services/     # Workflow関数（1ファイル=1ワークフロー）
│   └── types/        # Workflow<I,O,E> 型定義
├── infrastructure/   # 外部依存の実装（DB、WebSocket、HTTP）
│   ├── websocket/    # Socket.IO ゲートウェイ（純粋なハンドラ関数群）
│   └── http/         # Hono サーバー
├── db/               # Drizzle ORM スキーマ・接続
└── index.ts          # エントリポイント（依存性注入）
```

**パターン**: インフラ層のエントリポイントでDIを行い、ApplicationサービスはWorkflow型のファクトリ関数として実装。

## フロントエンド構成（Web版）

```
frontend/web/src/
├── components/       # Svelte コンポーネント（画面単位）
│   ├── MatchingScreen.svelte
│   ├── ChatScreen.svelte
│   └── ChatEndScreen.svelte
└── lib/
    ├── websocket/    # Socket.IO クライアントラッパー（シングルトン）
    └── stores/       # Svelte Store による状態管理
        ├── connectionStore  # 接続状態・セッションID
        ├── matchingStore    # マッチング待機状態
        ├── chatStore        # チャットルーム・タイマー
        └── messageStore     # メッセージ一覧
```

## 共有型パッケージ

`packages/shared-types` (`@cha-chat/shared-types`) でフロント・バックエンド間のWebSocketイベント型を共有:
- クライアント→サーバーイベントのペイロード型
- サーバー→クライアントイベントのペイロード型
- `WebSocketEvents` 定数（イベント名の一元管理）

## 開発方針
- フロントエンド・バックエンドは独立して開発可能
- Web版とモバイル版は同一のバックエンドAPIを使用
- イベント型の変更は `shared-types` パッケージを通じて両端に伝播
- 各ワークスペースパッケージは独自の依存関係管理を持つ
