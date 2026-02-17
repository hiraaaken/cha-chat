# 技術設計書: Cha-Chat

## Overview

**Purpose**: Cha-Chatは、匿名ユーザー同士が10分間限定で気軽にチャットできるリアルタイムコミュニケーションアプリケーションです。完全匿名性、一時性、シンプルさを核とした価値を提供します。

**Users**: プライバシーを重視し、アカウント登録なしで気軽に会話を楽しみたいユーザーが対象です。暇つぶしや軽い雑談を求める人々が、Webブラウザまたはモバイルアプリからアクセスして利用します。

**Impact**: 新規機能として、マルチプラットフォーム対応のリアルタイムチャットシステムを構築します。WebSocket通信によるリアルタイムメッセージング、自動マッチングシステム、時間制限付きチャットルーム管理、メッセージ自動削除機能を実現します。

### Goals

- 匿名ユーザー同士の自動マッチング機能を実装し、待機時間を最小化する
- WebSocket通信によるリアルタイムメッセージング基盤を構築する
- 10分間のチャットルーム管理と自動終了機能を提供する
- 自分が送信した3つ前より古いメッセージの自動削除ロジックを実装する
- Webブラウザ版（Svelte）とモバイルアプリ版（Flutter）で一貫したユーザー体験を提供する
- 完全匿名性とプライバシー保護を実現し、チャット終了後のデータ完全削除を保証する

### Non-Goals

- ユーザー認証・アカウント管理機能（完全匿名を維持）
- マルチメディアコンテンツ（画像、動画、ファイル）の送受信
- チャット履歴の永続保存やエクスポート機能
- 友達機能や連絡先リスト
- グループチャット（1対1のみ）
- メッセージ検索や編集機能

## Implementation Phases

この設計は段階的に実装し、各フェーズで動作確認を行いながら進めます。

### Phase 0: プロジェクト雛形とインフラストラクチャ基盤
**目的**: 開発環境の構築とプロジェクト構成の確立

**実装内容**:
- モノレポ構成（pnpm workspace）の設定
- backend/のディレクトリ構造とTypeScript設定
- Hono最小構成（ヘルスチェックエンドポイントのみ）
- Redis接続確認
- Supabase接続確認とDrizzle ORM初期設定

**達成可能な動作**: `GET /health` でサーバー稼働確認、Docker Compose起動確認

### Phase 1: WebSocket基本接続とセッション管理
**目的**: リアルタイム通信基盤の確立

**実装内容**:
- Socket.IOサーバー統合（Honoと同一HTTPサーバー上）
- WebSocketGateway基本実装（接続、切断イベント）
- SessionManager実装（匿名セッションID生成）
- クライアント接続テスト用の簡易HTMLページ

**達成可能な動作**: ブラウザからWebSocket接続、セッションID発行確認

### Phase 2: マッチング機能
**目的**: ユーザーペアリングとチャットルーム作成

**実装内容**:
- MatchingService実装（Redisキュー管理）
- RoomManager基本実装（ルーム作成、シンプルなタイマー）
- マッチング成立イベント配信
- データベーススキーマ作成（chat_rooms, messages）

**MVP Scope**: タイマー復元機能は省略し、シンプルなsetTimeoutで実装

**達成可能な動作**: 2つのブラウザでマッチング成立、ルームID共有確認

### Phase 3: メッセージ送受信と自動削除
**目的**: コアチャット機能の実装

**実装内容**:
- MessageService実装（送信、保存、削除ロジック）
- メッセージブロードキャスト
- 自動削除ロジック（自分の3つ前より古いメッセージ）
- チャットルーム終了処理

**達成可能な動作**: テキストメッセージ送受信、自動削除動作確認

### Phase 4: フロントエンド実装
**目的**: ユーザー向けUIの提供

**実装内容**:
- Web版UI（Svelte）
- モバイル版UI（Flutter）
- レスポンシブデザイン
- 残り時間表示、報告機能

### Phase 5: スケーラビリティとセキュリティ強化（Future Enhancements）
**目的**: 本番運用に向けた改善

**実装内容**:
- タイマー復元機能（Redis永続化 + サーバー起動時復元）
- Socket.IO Redis Adapter（水平スケーリング対応）
- レート制限（スパム対策）
- エラーモニタリング強化

## Architecture

### Architecture Pattern & Boundary Map

**Architecture Integration**:
- **Selected pattern**: シンプルレイヤードアーキテクチャ + イベント駆動要素
- **Rationale**: 初期実装の速度とリアルタイム性のバランスを重視。WebSocket中心のプロジェクトに適合し、実装複雑度を抑えながら必要な機能を提供。
- **Domain/feature boundaries**:
  - **マッチングドメイン**: ユーザー待機キュー管理、マッチングロジック、セッション生成
  - **チャットルームドメイン**: ルーム状態管理、タイマー制御、参加者管理
  - **メッセージングドメイン**: メッセージ送受信、削除ロジック、WebSocket通信
  - **クライアントレイヤー**: Web/モバイルUI、ローカル状態管理、WebSocket接続管理
- **Steering compliance**: プロダクトビジョン（匿名性・一時性・シンプルさ）と技術スタック要件に整合

```mermaid
graph TB
    subgraph ClientLayer[クライアントレイヤー]
        WebUI[Web UI - Svelte]
        MobileUI[Mobile UI - Flutter]
    end

    subgraph BackendLayer[バックエンドレイヤー]
        HonoServer[Hono Server - HTTP]
        WSGateway[WebSocket Gateway - Socket.IO]
        MatchingSvc[Matching Service]
        RoomMgr[Room Manager]
        MessageSvc[Message Service]
    end

    subgraph DataLayer[データレイヤー]
        Supabase[(Supabase - PostgreSQL)]
        Redis[(Redis - Queue)]
    end

    WebUI --> HonoServer
    WebUI --> WSGateway
    MobileUI --> WSGateway

    WSGateway --> MatchingSvc
    WSGateway --> RoomMgr
    WSGateway --> MessageSvc

    MatchingSvc --> Redis
    RoomMgr --> Supabase
    MessageSvc --> Supabase
```

**Key Decisions**:
- **バックエンドフレームワーク**: Hono v4.11.8を採用（軽量高速、Web Standards準拠）
- **リアルタイム通信**: Socket.IO v4.8.3を採用（room管理機能、自動再接続）
- **データベース**: Supabase（PostgreSQL）+ Drizzle ORM（型安全、マイグレーション管理）
- **マッチングキュー**: Redis（FIFO、アトミック操作）
- **状態管理**: Web版はSvelte 5 Runes（`$state` + 関数export）、モバイル版はRiverpod

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| **Frontend - Web** | Svelte v5.49.0 | Webブラウザ版UI実装 | Runes、改善されたTypeScript対応 |
| | socket.io-client v4.8.3 | WebSocket通信クライアント | Socket.IOサーバーとの双方向通信 |
| | Svelte 5 Runes (`$state`) | 状態管理 | `$state` オブジェクト + 関数export パターン |
| **Frontend - Mobile** | Flutter v3.38.6 | iOS/Androidアプリ実装 | クロスプラットフォーム |
| | socket_io_client | WebSocket通信クライアント | Socket.IOサーバーとの双方向通信 |
| | Riverpod | 状態管理 | 型安全な状態管理 |
| **Backend - Runtime** | Node.js v24.13.0 LTS | サーバーランタイム | 2028年4月までLTSサポート |
| | Hono v4.11.8 | HTTPフレームワーク | 軽量高速、モダンAPI |
| | Socket.IO v4.8.3 | WebSocketサーバー | room管理、自動再接続 |
| | TypeScript | 開発言語 | 型安全性 |
| **Data - Storage** | Supabase (PostgreSQL) | プライマリデータストア | マネージドPostgreSQL |
| | Drizzle ORM | ORM | 型安全クエリ、マイグレーション |
| | drizzle-kit | マイグレーションツール | スキーマ管理 |
| **Data - Cache/Queue** | Redis | マッチングキュー管理 | FIFO、セッション管理 |
| | ioredis | Redisクライアント | 接続プール対応 |
| **Infrastructure** | pnpm workspace | モノレポ管理 | 依存関係統合管理 |
| | Biome | リンター/フォーマッター | コード品質統一 |
| **Containerization** | Docker | コンテナランタイム | 開発環境統一 |
| | Docker Compose v2 | オーケストレーション | サービス管理 |
| | Redis 7-alpine | キャッシュ/キュー | 軽量イメージ |

### Project Structure

モノレポ構成とディレクトリ構造の詳細を以下に示します。

#### モノレポ構成（pnpm workspace）

**pnpm-workspace.yaml**:
```yaml
packages:
  - 'backend'
  - 'frontend/web'
  - 'frontend/mobile'
  - 'packages/*'
```

#### Backend ディレクトリ構造

```
backend/
├── src/
│   ├── domain/                    # ドメイン層
│   │   ├── entities/              # エンティティ
│   │   │   ├── chatRoom.ts
│   │   │   ├── message.ts
│   │   │   ├── report.ts
│   │   │   └── session.ts
│   │   ├── types/                 # 型定義
│   │   │   ├── base.ts            # Newtype, ValidationError
│   │   │   └── valueObjects.ts    # RoomId, SessionId, MessageId, etc.
│   │   └── events/                # ドメインイベント
│   │       ├── index.ts           # DomainEvent型定義
│   │       └── websocket.ts       # WebSocketイベントスキーマ（Zod）
│   ├── application/               # アプリケーション層（サービス）
│   │   ├── services/
│   │   │   ├── matchingService.ts
│   │   │   ├── roomManager.ts
│   │   │   ├── messageService.ts
│   │   │   ├── sessionManager.ts
│   │   │   └── reportService.ts
│   │   └── interfaces/            # サービスインターフェース
│   │       ├── matchingServiceInterface.ts
│   │       ├── roomManagerInterface.ts
│   │       └── messageServiceInterface.ts
│   ├── infrastructure/            # インフラストラクチャ層
│   │   ├── http/
│   │   │   └── honoServer.ts      # Honoサーバー初期化
│   │   ├── websocket/
│   │   │   └── websocketGateway.ts # Socket.IOサーバー
│   │   ├── database/
│   │   │   ├── drizzle.ts         # Drizzle ORM設定
│   │   │   └── migrations/        # マイグレーションファイル
│   │   ├── cache/
│   │   │   └── redis.ts           # Redis接続管理
│   │   └── error-handler.ts       # エラーハンドラー
│   ├── db/
│   │   └── schema.ts              # Drizzleスキーマ定義
│   └── index.ts                   # エントリポイント
├── package.json
├── tsconfig.json
├── biome.json
├── Dockerfile
└── .env.example

packages/                          # 共有パッケージ
└── shared-types/                  # フロントエンド/バックエンド共有型
    ├── src/
    │   ├── events.ts              # WebSocketイベント型
    │   └── index.ts
    ├── package.json
    └── tsconfig.json
```

#### Frontend (Web) ディレクトリ構造

```
frontend/web/
├── src/
│   ├── lib/
│   │   ├── stores/                # Svelte Store（Runes: $state + 関数export）
│   │   │   ├── chatStore.svelte.ts
│   │   │   ├── messageStore.svelte.ts
│   │   │   ├── connectionStore.svelte.ts
│   │   │   └── matchingStore.svelte.ts
│   │   └── websocket/
│   │       └── socketClient.ts    # Socket.IO Client
│   ├── components/                # UIコンポーネント
│   │   ├── ChatRoom.svelte
│   │   ├── MessageList.svelte
│   │   ├── MessageInput.svelte
│   │   └── Timer.svelte
│   ├── routes/                    # ページルート
│   │   ├── +page.svelte
│   │   └── +layout.svelte
│   └── app.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── Dockerfile
└── nginx.conf
```

## System Flows

### マッチングフロー

```mermaid
sequenceDiagram
    participant User1
    participant User2
    participant Gateway as WebSocket Gateway
    participant Match as Matching Service
    participant Queue as Redis Queue
    participant Room as Room Manager
    participant DB as Supabase

    User1->>Gateway: requestMatch
    Gateway->>Match: enqueueUser(session1)
    Match->>Queue: LPUSH waiting_queue session1
    Match-->>User1: waiting

    User2->>Gateway: requestMatch
    Gateway->>Match: enqueueUser(session2)
    Match->>Queue: LPUSH waiting_queue session2
    Match->>Queue: RPOP waiting_queue x2

    Match->>Room: createRoom(session1, session2)
    Room->>DB: INSERT chat_rooms
    Room-->>Match: roomId

    Match->>Gateway: matchFound(session1, session2, roomId)
    Gateway-->>User1: matchFound
    Gateway-->>User2: matchFound

    Room->>Room: startTimer(10min)
```

**Key Decisions**:
- FIFOキューベースのシンプルなマッチングアルゴリズム
- Redis LPUSH/RPOPでアトミック操作
- マッチング成立時に即座にチャットルーム作成

### メッセージ送受信フロー

```mermaid
sequenceDiagram
    participant User1
    participant User2
    participant Gateway as WebSocket Gateway
    participant MsgSvc as Message Service
    participant DB as Supabase

    User1->>Gateway: sendMessage(roomId, text)
    Gateway->>MsgSvc: handleMessage(session1, roomId, text)

    MsgSvc->>DB: INSERT messages
    MsgSvc->>MsgSvc: countUserMessages(session1, roomId)

    alt 自分のメッセージが4件以上
        MsgSvc->>DB: DELETE oldest message
        MsgSvc-->>User1: messageDeleted(oldMessageId)
    end

    MsgSvc->>Gateway: broadcast(roomId, message)
    Gateway-->>User1: newMessage
    Gateway-->>User2: newMessage
```

**Key Decisions**:
- メッセージ送信と削除判定を同一処理で実行
- 各ユーザーの送信メッセージは最新3件のみ保持
- Socket.IO room機能でブロードキャスト

### チャットルーム終了フロー

```mermaid
sequenceDiagram
    participant Timer
    participant Room as Room Manager
    participant MsgSvc as Message Service
    participant Gateway as WebSocket Gateway
    participant DB as Supabase
    participant User1
    participant User2

    Timer->>Room: 10分経過
    Room->>MsgSvc: deleteAllMessages(roomId)
    MsgSvc->>DB: DELETE FROM messages WHERE room_id
    Room->>DB: UPDATE chat_rooms SET status = closed

    Room->>Gateway: roomClosed(roomId)
    Gateway-->>User1: roomClosed
    Gateway-->>User2: roomClosed
```

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Flows |
|-------------|---------|------------|------------|-------|
| 1.1 | 待機中ユーザーと自動ペアリング | MatchingService | MatchingServiceInterface | マッチングフロー |
| 1.2 | マッチング不可時に待機キューへ追加 | MatchingService | MatchingServiceInterface | マッチングフロー |
| 1.3 | マッチング成立時に新規チャットルーム作成 | RoomManager | RoomManagerInterface | マッチングフロー |
| 1.4 | 完全匿名マッチング | MatchingService, SessionManager | SessionInterface | マッチングフロー |
| 2.1 | チャットルーム作成時に10分タイマー開始 | RoomManager | RoomManagerInterface | チャットルーム終了フロー |
| 2.2 | 残り時間を両ユーザーに表示 | WebSocketGateway, RoomManager | WebSocketEventContract | チャットルーム終了フロー |
| 2.3 | 10分経過後に自動終了 | RoomManager | RoomManagerInterface | チャットルーム終了フロー |
| 2.4 | 終了時に全メッセージ削除 | MessageService, RoomManager | MessageServiceInterface | チャットルーム終了フロー |
| 2.5 | ユーザー途中退出時に通知と終了 | RoomManager, WebSocketGateway | WebSocketEventContract | チャットルーム終了フロー |
| 3.1 | メッセージ即座配信 | MessageService, WebSocketGateway | WebSocketEventContract | メッセージ送受信フロー |
| 3.2 | テキストのみ送信許可 | MessageService | MessageServiceInterface | メッセージ送受信フロー |
| 3.3 | メッセージ送信時刻記録 | MessageService | MessageModel | メッセージ送受信フロー |
| 3.4 | 送信者識別子付与 | MessageService | MessageModel | メッセージ送受信フロー |
| 3.5 | 送信失敗時のエラー通知 | WebSocketGateway | WebSocketEventContract | メッセージ送受信フロー |
| 4.1 | 新規メッセージ送信時に履歴評価 | MessageService | MessageServiceInterface | メッセージ送受信フロー |
| 4.2 | 自分のメッセージ4つ以上で最古削除 | MessageService | MessageServiceInterface | メッセージ送受信フロー |
| 4.3 | 最新3件のみ保持 | MessageService | MessageServiceInterface | メッセージ送受信フロー |
| 4.4 | 相手メッセージは削除対象外 | MessageService | MessageServiceInterface | メッセージ送受信フロー |
| 4.5 | 削除時にUI即座非表示 | WebUI, MobileUI, WebSocketGateway | WebSocketEventContract | メッセージ送受信フロー |
| 5.1 | Webブラウザ版フロントエンド | WebUI (Svelte) | - | - |
| 5.2 | モバイルアプリ版フロントエンド | MobileUI (Flutter) | - | - |
| 5.3 | UI/UX一貫性保持 | WebUI, MobileUI | UIComponents | - |
| 5.4 | 同一バックエンドAPI使用 | WebSocketGateway | WebSocketEventContract | 全フロー |
| 5.5 | 同一マッチングプール | MatchingService | MatchingServiceInterface | マッチングフロー |
| 5.6 | レスポンシブデザイン | WebUI | UIComponents | - |
| 6.1 | 残り時間カウントダウン表示 | WebUI, MobileUI, RoomManager | UIComponents | チャットルーム終了フロー |
| 6.2 | 自分/相手メッセージ視覚的区別 | WebUI, MobileUI | UIComponents | - |
| 6.3 | テキスト入力と送信ボタン提供 | WebUI, MobileUI | UIComponents | メッセージ送受信フロー |
| 6.4 | メッセージ一覧リアルタイム更新 | WebUI, MobileUI, WebSocketGateway | WebSocketEventContract | メッセージ送受信フロー |
| 6.5 | チャット終了通知と再マッチング促進 | WebUI, MobileUI, WebSocketGateway | WebSocketEventContract | チャットルーム終了フロー |
| 6.6 | Web/モバイル同等機能提供 | WebUI, MobileUI | UIComponents | 全フロー |
| 7.1 | 個人情報を収集しない | SessionManager | SessionInterface | マッチングフロー |
| 7.2 | セッションごと匿名識別子生成 | SessionManager | SessionInterface | マッチングフロー |
| 7.3 | 終了後に完全削除 | MessageService, RoomManager | MessageServiceInterface | チャットルーム終了フロー |
| 7.4 | チャットルーム外アクセス不可 | WebSocketGateway, RoomManager | WebSocketEventContract | 全フロー |
| 7.5 | 不適切コンテンツ報告機能 | ReportService | ReportServiceInterface | - |

## Components and Interfaces

| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies (P0/P1) | Contracts |
|-----------|--------------|--------|--------------|--------------------------|-----------|
| HonoServer | Backend/HTTP | HTTPエンドポイント処理 | - | Node.js (P0) | API |
| WebSocketGateway | Backend/通信 | WebSocket接続とイベントルーティング | 全要件 | Socket.IO (P0) | Event |
| MatchingService | Backend/ドメイン | ユーザーマッチングロジック | 1.1-1.4, 5.5 | Redis (P0), RoomManager (P0) | Service |
| RoomManager | Backend/ドメイン | チャットルーム管理とタイマー制御 | 2.1-2.5, 6.1 | Supabase (P0), MessageService (P1) | Service, State |
| MessageService | Backend/ドメイン | メッセージ送受信と削除ロジック | 3.1-3.5, 4.1-4.5 | Supabase (P0), WebSocketGateway (P0) | Service |
| SessionManager | Backend/セキュリティ | 匿名セッション生成と管理 | 1.4, 7.1-7.2 | - | Service |
| ReportService | Backend/セキュリティ | 不適切コンテンツ報告処理 | 7.5 | Supabase (P0) | Service |
| WebUI | Frontend/Web | Svelte実装のWebブラウザUI | 5.1, 5.3, 5.6, 6.1-6.6 | Socket.IO Client (P0) | State |
| MobileUI | Frontend/Mobile | Flutter実装のモバイルアプリUI | 5.2, 5.3, 6.1-6.6 | socket_io_client (P0) | State |

### Backend / HTTP層

#### HonoServer

| Field | Detail |
|-------|--------|
| Intent | HTTPエンドポイントの提供（ヘルスチェック、API） |
| Requirements | - |

**Responsibilities & Constraints**
- HTTPリクエストの受信と処理
- ヘルスチェックエンドポイントの提供（`GET /health`）
- Socket.IOサーバーと同一HTTPサーバー上で並行動作

**Dependencies**
- Inbound: クライアント — HTTPリクエスト (P1)
- External: @hono/node-server — Node.js統合 (P0)

**Contracts**: API [X]

##### API Contract

| Method | Endpoint | Request | Response | Errors |
|--------|----------|---------|----------|--------|
| GET | /health | - | `{ status: 'ok', timestamp: string }` | 500 |

**Implementation Notes**
- Integration: `node:http.createServer`でHTTPサーバーを作成し、Socket.IOと共有
- Validation: リクエストペイロードは必要に応じてバリデーション

### Backend / WebSocket通信層

#### WebSocketGateway

| Field | Detail |
|-------|--------|
| Intent | WebSocket接続の確立、切断、イベント受信とルーティング |
| Requirements | 全要件 |

**Responsibilities & Constraints**
- Socket.IOサーバーの初期化と接続管理
- クライアントからのイベント受信と適切なサービスへのディスパッチ
- サーバーからクライアントへのイベント送信（個別送信、ルーム内ブロードキャスト）
- 接続エラー、切断、再接続のハンドリング

**Dependencies**
- Inbound: WebUI, MobileUI — WebSocket接続 (P0)
- Outbound: MatchingService — マッチングリクエスト (P0)
- Outbound: MessageService — メッセージ送受信 (P0)
- Outbound: RoomManager — チャットルーム操作 (P0)
- External: Socket.IO v4.8.3 — WebSocket通信 (P0)

**Contracts**: Event [X]

##### Event Contract

**Published Events**:
- `matchFound`: マッチング成立 `{ roomId: string, partnerSessionId: string }`
- `newMessage`: 新規メッセージ `{ messageId: string, senderSessionId: string, text: string, createdAt: Date }`
- `messageDeleted`: メッセージ削除 `{ messageId: string }`
- `roomClosed`: チャットルーム終了 `{ roomId: string, reason: 'timeout' | 'user_left' | 'reported' }`
- `partnerDisconnected`: 相手切断 `{ roomId: string }`
- `timerUpdate`: 残り時間更新 `{ roomId: string, remainingSeconds: number }`
- `error`: エラー `{ code: string, message: string }`

**Subscribed Events**:
- `requestMatch`: マッチングリクエスト `{}`
- `sendMessage`: メッセージ送信 `{ roomId: string, text: string }`
- `leaveRoom`: チャットルーム退出 `{ roomId: string }`
- `reportContent`: 不適切コンテンツ報告 `{ roomId: string, reason: string }`

**Ordering / Delivery Guarantees**:
- メッセージ送信順序はSocket.IOのTCP保証に依存
- room内ブロードキャストは全参加者に配信保証

**Implementation Notes**
- Integration: HonoサーバーとSocket.IOサーバーを共有HTTPサーバー上で並行動作
- Validation: イベントペイロードは受信時にZodスキーマで検証
  - 例: `sendMessage`イベント受信時
    ```typescript
    socket.on('sendMessage', (data) => {
      const result = validatePayload(SendMessageSchema, data);
      if (result.isErr()) {
        socket.emit('error', { code: 'VALIDATION_ERROR', message: result.error.message });
        return;
      }
      const payload = result.value; // 型安全なペイロード
      // ... 処理続行
    });
    ```

### Backend / ドメインロジック層

#### MatchingService

| Field | Detail |
|-------|--------|
| Intent | ユーザーマッチングキュー管理とペアリングロジック |
| Requirements | 1.1, 1.2, 1.3, 1.4, 5.5 |

**Responsibilities & Constraints**
- マッチング待機キュー（Redis）への登録と取り出し
- FIFOアルゴリズムによる2ユーザーのペアリング
- マッチング成立時のRoomManager呼び出し

**Dependencies**
- Inbound: WebSocketGateway — マッチングリクエスト (P0)
- Outbound: RoomManager — チャットルーム作成 (P0)
- Outbound: SessionManager — 匿名識別子取得 (P0)
- External: Redis (ioredis) — 待機キュー (P0)

**Contracts**: Service [X]

##### Service Interface

```typescript
import { Result } from 'neverthrow';
import { SessionId, RoomId } from '../domain/types/valueObjects';
import { ActiveChatRoom } from '../domain/entities/chatRoom';
import { MatchFoundEvent } from '../domain/events';

interface MatchingServiceInterface {
  enqueueUser(sessionId: SessionId): Promise<Result<void, MatchingError>>;
  dequeueUser(sessionId: SessionId): Promise<Result<void, MatchingError>>;
  tryMatch(): Promise<Result<MatchResult | null, MatchingError>>;
}

interface MatchResult {
  user1SessionId: SessionId;
  user2SessionId: SessionId;
  room: ActiveChatRoom;
  event: MatchFoundEvent;
}

type MatchingError =
  | { type: 'QUEUE_ERROR'; message: string }
  | { type: 'ROOM_CREATION_FAILED'; message: string }
  | { type: 'ALREADY_IN_QUEUE'; sessionId: SessionId };
```

**Implementation Notes**
- Integration: Redis LPUSH/RPOPでアトミックキュー操作
- Validation: SessionIdファクトリ関数でバリデーション済み

#### RoomManager

| Field | Detail |
|-------|--------|
| Intent | チャットルームのライフサイクル管理 |
| Requirements | 2.1, 2.2, 2.3, 2.4, 2.5, 6.1 |

**Responsibilities & Constraints**
- チャットルームの作成とSupabaseへの永続化
- 10分タイマーの開始と残り時間の定期配信
- タイマー終了時の全メッセージ削除とルームクローズ
- ユーザー途中退出の検知と通知
- サーバー再起動時のタイマー復元（Future Enhancement - Phase 5のみ、MVP Scopeでは省略）

**Dependencies**
- Inbound: MatchingService — チャットルーム作成 (P0)
- Inbound: WebSocketGateway — ユーザー切断通知 (P0)
- Outbound: MessageService — メッセージ削除 (P1)
- External: Supabase (Drizzle ORM) — データ永続化 (P0)
- External: Redis (ioredis) — タイマー永続化 (P0)

**Contracts**: Service [X] / State [X]

##### Service Interface

```typescript
import { Result } from 'neverthrow';
import { RoomId, SessionId } from '../domain/types/valueObjects';
import { ChatRoom, ActiveChatRoom, ClosedChatRoom, RoomCloseReason } from '../domain/entities/chatRoom';
import { RoomClosedEvent } from '../domain/events';

interface RoomManagerInterface {
  createRoom(user1SessionId: SessionId, user2SessionId: SessionId): Promise<Result<ActiveChatRoom, RoomError>>;
  closeRoom(roomId: RoomId, reason: RoomCloseReason): Promise<Result<RoomClosedEvent, RoomError>>;
  getRoom(roomId: RoomId): Promise<Result<ChatRoom, RoomError>>;
  getRoomStatus(roomId: RoomId): Promise<Result<RoomStatus, RoomError>>;
  handleUserDisconnect(sessionId: SessionId, roomId: RoomId): Promise<Result<RoomClosedEvent, RoomError>>;
  restoreActiveTimers(): Promise<Result<RestoredTimer[], RoomError>>; // Future Enhancement (Phase 5)
}

interface RoomStatus {
  roomId: RoomId;
  remainingSeconds: number;
  isActive: boolean;
}

interface RestoredTimer {
  roomId: RoomId;
  remainingSeconds: number;
  restored: boolean;
}

type RoomError =
  | { type: 'ROOM_NOT_FOUND'; roomId: RoomId }
  | { type: 'ROOM_ALREADY_CLOSED'; roomId: RoomId }
  | { type: 'DATABASE_ERROR'; message: string }
  | { type: 'REDIS_ERROR'; message: string };
```

##### State Management

**State Model**:
- チャットルーム状態: `active`, `closed`
- タイマー状態: `setTimeout`で管理、残り時間を1分ごとにブロードキャスト
- タイマー永続化: Redisに`room:timer:{roomId}`をHash型で保存

**Persistence & Consistency**:
- Supabaseにチャットルーム情報を永続化
- Drizzle ORMでトランザクション管理
- Redisにタイマー情報を永続化（`expiresAt`タイムスタンプ）

**Implementation Notes**
- Integration:
  - Drizzle ORMでINSERT/UPDATE
  - タイマーはsetTimeoutで管理
  - **MVP Scope (Phase 2)**: シンプルなsetTimeoutのみ実装、Redis永続化は省略
  - **Future Enhancement (Phase 5)**: Redis統合でタイマー永続化を実現
    - ルーム作成時: `HSET room:timer:{roomId} expiresAt {timestamp}` + `EXPIRE room:timer:{roomId} 600`
    - サーバー起動時: `KEYS room:timer:*`で全タイマーを取得し、`setTimeout`を復元
    - ルーム終了時: `DEL room:timer:{roomId}`でタイマー情報を削除
- Failsafe: pg_cronが1分ごとに期限切れルームをクリーンアップ（バックアップ機構、MVP Scopeでも実装）

#### MessageService

| Field | Detail |
|-------|--------|
| Intent | メッセージ送受信、自動削除ロジック |
| Requirements | 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5 |

**Responsibilities & Constraints**
- テキストメッセージのバリデーションと保存
- 各ユーザーの送信メッセージカウントと古いメッセージの自動削除
- チャットルーム終了時の全メッセージ一括削除

**Dependencies**
- Inbound: WebSocketGateway — メッセージ送信 (P0)
- Inbound: RoomManager — 全メッセージ削除 (P1)
- Outbound: WebSocketGateway — メッセージ配信 (P0)
- External: Supabase (Drizzle ORM) — データ永続化 (P0)

**Contracts**: Service [X]

##### Service Interface

```typescript
import { Result } from 'neverthrow';
import { RoomId, SessionId, MessageId, MessageText } from '../domain/types/valueObjects';
import { Message } from '../domain/entities/message';
import { MessageSentEvent, MessageDeletedEvent } from '../domain/events';

interface MessageServiceInterface {
  sendMessage(sessionId: SessionId, roomId: RoomId, text: MessageText): Promise<Result<SendMessageResult, MessageError>>;
  deleteOldMessages(sessionId: SessionId, roomId: RoomId): Promise<Result<MessageDeletedEvent[], MessageError>>;
  deleteAllMessages(roomId: RoomId): Promise<Result<void, MessageError>>;
  getMessages(roomId: RoomId): Promise<Result<Message[], MessageError>>;
}

interface SendMessageResult {
  message: Message;
  event: MessageSentEvent;
  deletedMessages: MessageDeletedEvent[];
}

type MessageError =
  | { type: 'ROOM_NOT_FOUND'; roomId: RoomId }
  | { type: 'ROOM_CLOSED'; roomId: RoomId }
  | { type: 'DATABASE_ERROR'; message: string };
```

**Implementation Notes**
- Integration: Drizzle ORMでINSERT/DELETE、トランザクションで整合性保証
- Validation: MessageTextファクトリ関数でバリデーション済み（1-500文字、HTMLタグ除去）

#### SessionManager

| Field | Detail |
|-------|--------|
| Intent | 匿名セッション識別子の生成と管理 |
| Requirements | 1.4, 7.1, 7.2 |

**Responsibilities & Constraints**
- WebSocket接続時に一意の匿名セッションIDを生成
- 個人情報を一切収集しない

**Dependencies**
- Inbound: WebSocketGateway — セッション生成 (P0)

**Contracts**: Service [X]

##### Service Interface

```typescript
import { Result } from 'neverthrow';
import { SessionId, SocketId } from '../domain/types/valueObjects';
import { Session } from '../domain/entities/session';

interface SessionManagerInterface {
  generateSession(socketId: SocketId): Session;
  getSession(sessionId: SessionId): Result<Session, SessionError>;
  invalidateSession(sessionId: SessionId): Result<void, SessionError>;
  bindSocketToSession(sessionId: SessionId, socketId: SocketId): Result<void, SessionError>;
}

type SessionError =
  | { type: 'SESSION_NOT_FOUND'; sessionId: SessionId }
  | { type: 'SESSION_EXPIRED'; sessionId: SessionId }
  | { type: 'SOCKET_ALREADY_BOUND'; socketId: SocketId };
```

**Implementation Notes**
- Integration: UUID v4でセッションID生成、メモリまたはRedisで管理
- SessionIdファクトリ関数でバリデーション済み

#### ReportService

| Field | Detail |
|-------|--------|
| Intent | 不適切コンテンツの報告受付 |
| Requirements | 7.5 |

**Responsibilities & Constraints**
- ユーザーからの報告を受け付け、Supabaseに記録

**Dependencies**
- Inbound: WebSocketGateway — 報告リクエスト (P0)
- External: Supabase (Drizzle ORM) — 報告ログ保存 (P0)

**Contracts**: Service [X]

##### Service Interface

```typescript
import { Result } from 'neverthrow';
import { RoomId, SessionId, ReportReason } from '../domain/types/valueObjects';
import { Report } from '../domain/entities/report';

interface ReportServiceInterface {
  submitReport(sessionId: SessionId, roomId: RoomId, reason: ReportReason): Promise<Result<Report, ReportError>>;
  getReportsByRoom(roomId: RoomId): Promise<Result<Report[], ReportError>>;
}

type ReportError =
  | { type: 'ROOM_NOT_FOUND'; roomId: RoomId }
  | { type: 'ALREADY_REPORTED'; sessionId: SessionId; roomId: RoomId }
  | { type: 'DATABASE_ERROR'; message: string };
```

### Frontend / Web UI層

#### WebUI (Svelte)

| Field | Detail |
|-------|--------|
| Intent | Webブラウザ版ユーザーインターフェース |
| Requirements | 5.1, 5.3, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6 |

**Responsibilities & Constraints**
- WebSocket接続管理
- チャット画面UI（メッセージ一覧、入力フィールド、送信ボタン）
- 残り時間カウントダウン表示
- レスポンシブデザイン

**Dependencies**
- Outbound: WebSocketGateway — メッセージ送受信 (P0)
- External: socket.io-client v4.8.3 — WebSocket通信 (P0)
- External: Svelte 5 Runes (`$state`) — 状態管理 (P0)

**Contracts**: State [X]

##### State Management

**Implementation Pattern**: Svelte 5 Runes — `$state` オブジェクト + 関数export（`.svelte.ts` ファイル）

**State Model**:
- `chatStore`: チャットルーム状態（roomStatus, roomId, remainingSeconds, closeReason）
- `messageStore`: メッセージ一覧（messages配列）
- `connectionStore`: WebSocket接続状態（status, sessionId, error）
- `matchingStore`: マッチング状態（status）

### Frontend / Mobile UI層

#### MobileUI (Flutter)

| Field | Detail |
|-------|--------|
| Intent | iOS/Androidモバイルアプリ版UI |
| Requirements | 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6 |

**Responsibilities & Constraints**
- WebSocket接続管理
- チャット画面UI
- iOS/Androidネイティブ対応

**Dependencies**
- Outbound: WebSocketGateway — メッセージ送受信 (P0)
- External: socket_io_client — WebSocket通信 (P0)
- External: Riverpod — 状態管理 (P0)

**Contracts**: State [X]

##### State Management

**State Model**:
- `chatRoomProvider`: チャットルーム状態
- `messageListProvider`: メッセージ一覧
- `connectionStateProvider`: WebSocket接続状態

## Data Models

### Domain Model

**Aggregates & Transactional Boundaries**:
- **ChatRoomAggregate**: チャットルームとメッセージ群を1つの集約として管理
- **MatchingQueueAggregate**: 待機中ユーザーのキュー（Redis管理）

**Entities & Value Objects**:
- **Entity**: ChatRoom, Message, Report
- **Value Object**: RoomId, SessionId, MessageId, MessageText, ReportReason

**Business Rules & Invariants**:
- チャットルームは常に2ユーザーのみ参加
- 各ユーザーの表示メッセージは最新3件まで
- チャットルーム有効期間は10分間
- メッセージはテキストのみ（500文字以内）

### Type Definitions

**設計原則**: 型で仕様とワークフローをモデリングし、実装はその後に行う

#### 基盤定義

```typescript
// backend/src/domain/types/base.ts
import { ok, err, Result } from 'neverthrow';

declare const brand: unique symbol;
export type Newtype<K extends string, T> = T & { [brand]: K };

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

#### 値オブジェクト

```typescript
// backend/src/domain/types/valueObjects.ts
import { ok, err, Result } from 'neverthrow';
import { Newtype, ValidationError } from './base';

// --- RoomId ---
export type RoomId = Newtype<'RoomId', string>;

export function RoomId(value: string): Result<RoomId, ValidationError> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value)
    ? ok(value as RoomId)
    : err(new ValidationError('RoomIdはUUID v4形式である必要があります'));
}

// --- SessionId ---
export type SessionId = Newtype<'SessionId', string>;

export function SessionId(value: string): Result<SessionId, ValidationError> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value)
    ? ok(value as SessionId)
    : err(new ValidationError('SessionIdはUUID v4形式である必要があります'));
}

// --- MessageId ---
export type MessageId = Newtype<'MessageId', string>;

export function MessageId(value: string): Result<MessageId, ValidationError> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value)
    ? ok(value as MessageId)
    : err(new ValidationError('MessageIdはUUID v4形式である必要があります'));
}

// --- MessageText ---
export type MessageText = Newtype<'MessageText', string>;

const MAX_MESSAGE_LENGTH = 500;

export function MessageText(value: string): Result<MessageText, ValidationError> {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return err(new ValidationError('メッセージは空にできません'));
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return err(new ValidationError(`メッセージは${MAX_MESSAGE_LENGTH}文字以内である必要があります`));
  }
  // HTMLタグ除去
  const sanitized = trimmed.replace(/<[^>]*>/g, '');
  return ok(sanitized as MessageText);
}

// --- ReportReason ---
export type ReportReason = 'spam' | 'harassment' | 'inappropriate_content' | 'other';

export function ReportReason(value: string): Result<ReportReason, ValidationError> {
  const validReasons: ReportReason[] = ['spam', 'harassment', 'inappropriate_content', 'other'];
  return validReasons.includes(value as ReportReason)
    ? ok(value as ReportReason)
    : err(new ValidationError('無効な報告理由です'));
}

// --- SocketId ---
export type SocketId = Newtype<'SocketId', string>;

export function SocketId(value: string): Result<SocketId, ValidationError> {
  return value.length > 0
    ? ok(value as SocketId)
    : err(new ValidationError('SocketIdが不正です'));
}
```

#### エンティティ（Union型による状態表現）

```typescript
// backend/src/domain/entities/chatRoom.ts
import { RoomId, SessionId } from '../types/valueObjects';

// --- ChatRoom: Union型で状態を表現 ---
export type ChatRoom = ActiveChatRoom | ClosedChatRoom;

interface _ChatRoom {
  id: RoomId;
  user1SessionId: SessionId;
  user2SessionId: SessionId;
  createdAt: Date;
  expiresAt: Date;
}

export interface ActiveChatRoom extends _ChatRoom {
  status: 'active';
}

export interface ClosedChatRoom extends _ChatRoom {
  status: 'closed';
  closedAt: Date;
  closeReason: RoomCloseReason;
}

export type RoomCloseReason = 'timeout' | 'user_left' | 'reported';

// --- ファクトリ関数 ---
export function createActiveChatRoom(
  id: RoomId,
  user1SessionId: SessionId,
  user2SessionId: SessionId,
  createdAt: Date,
  expiresAt: Date
): ActiveChatRoom {
  return {
    id,
    user1SessionId,
    user2SessionId,
    createdAt,
    expiresAt,
    status: 'active',
  };
}

export function closeChatRoom(
  room: ActiveChatRoom,
  reason: RoomCloseReason
): ClosedChatRoom {
  return {
    ...room,
    status: 'closed',
    closedAt: new Date(),
    closeReason: reason,
  };
}
```

```typescript
// backend/src/domain/entities/message.ts
import { MessageId, RoomId, SessionId, MessageText } from '../types/valueObjects';

export interface Message {
  id: MessageId;
  roomId: RoomId;
  senderSessionId: SessionId;
  text: MessageText;
  createdAt: Date;
}

export function createMessage(
  id: MessageId,
  roomId: RoomId,
  senderSessionId: SessionId,
  text: MessageText,
  createdAt: Date
): Message {
  return { id, roomId, senderSessionId, text, createdAt };
}
```

```typescript
// backend/src/domain/entities/report.ts
import { RoomId, SessionId, ReportReason } from '../types/valueObjects';
import { Newtype, ValidationError } from '../types/base';
import { ok, err, Result } from 'neverthrow';

export type ReportId = Newtype<'ReportId', string>;

export function ReportId(value: string): Result<ReportId, ValidationError> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value)
    ? ok(value as ReportId)
    : err(new ValidationError('ReportIdはUUID v4形式である必要があります'));
}

export interface Report {
  id: ReportId;
  roomId: RoomId;
  reporterSessionId: SessionId;
  reason: ReportReason;
  createdAt: Date;
}

export function createReport(
  id: ReportId,
  roomId: RoomId,
  reporterSessionId: SessionId,
  reason: ReportReason,
  createdAt: Date
): Report {
  return { id, roomId, reporterSessionId, reason, createdAt };
}
```

```typescript
// backend/src/domain/entities/session.ts
import { SessionId, SocketId, RoomId } from '../types/valueObjects';

export interface Session {
  sessionId: SessionId;
  socketId: SocketId;
  createdAt: Date;
}

// --- マッチング状態: Union型で表現 ---
export type MatchingStatus = Waiting | Matched;

export interface Waiting {
  status: 'waiting';
  sessionId: SessionId;
  enqueuedAt: Date;
}

export interface Matched {
  status: 'matched';
  sessionId: SessionId;
  roomId: RoomId;
  matchedAt: Date;
}

// --- ファクトリ関数 ---
export function createSession(
  sessionId: SessionId,
  socketId: SocketId,
  createdAt: Date
): Session {
  return { sessionId, socketId, createdAt };
}

export function createWaiting(
  sessionId: SessionId,
  enqueuedAt: Date
): Waiting {
  return { status: 'waiting', sessionId, enqueuedAt };
}

export function createMatched(
  sessionId: SessionId,
  roomId: RoomId,
  matchedAt: Date
): Matched {
  return { status: 'matched', sessionId, roomId, matchedAt };
}
```

#### ドメインイベント

```typescript
// backend/src/domain/events/index.ts
import { RoomId, SessionId, MessageId, MessageText, ReportReason } from '../types/valueObjects';

export type DomainEvent =
  | MatchFoundEvent
  | MessageSentEvent
  | MessageDeletedEvent
  | RoomClosedEvent
  | PartnerDisconnectedEvent;

export interface MatchFoundEvent {
  type: 'MatchFound';
  roomId: RoomId;
  user1SessionId: SessionId;
  user2SessionId: SessionId;
  occurredAt: Date;
}

export interface MessageSentEvent {
  type: 'MessageSent';
  messageId: MessageId;
  roomId: RoomId;
  senderSessionId: SessionId;
  text: MessageText;
  occurredAt: Date;
}

export interface MessageDeletedEvent {
  type: 'MessageDeleted';
  messageId: MessageId;
  roomId: RoomId;
  occurredAt: Date;
}

export interface RoomClosedEvent {
  type: 'RoomClosed';
  roomId: RoomId;
  reason: 'timeout' | 'user_left' | 'reported';
  occurredAt: Date;
}

export interface PartnerDisconnectedEvent {
  type: 'PartnerDisconnected';
  roomId: RoomId;
  disconnectedSessionId: SessionId;
  occurredAt: Date;
}
```

### ER Diagram

```mermaid
erDiagram
    chat_rooms ||--o{ messages : contains
    chat_rooms {
        uuid id PK
        text user1_session_id
        text user2_session_id
        timestamp created_at
        timestamp expires_at
        text status
        timestamp closed_at
        text close_reason
    }
    messages {
        uuid id PK
        uuid room_id FK
        text sender_session_id
        text text
        timestamp created_at
    }
    reports {
        uuid id PK
        uuid room_id
        text reporter_session_id
        text reason
        timestamp created_at
    }
```

### Physical Data Model

**Drizzle Schema Definition**:

```typescript
// backend/src/db/schema.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const chatRooms = pgTable('chat_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  user1SessionId: text('user1_session_id').notNull(),
  user2SessionId: text('user2_session_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  status: text('status').notNull().default('active'),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => chatRooms.id, { onDelete: 'cascade' }),
  senderSessionId: text('sender_session_id').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull(),
  reporterSessionId: text('reporter_session_id').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const chatRoomsRelations = relations(chatRooms, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  room: one(chatRooms, { fields: [messages.roomId], references: [chatRooms.id] }),
}));
```

**Indexes**:
- `chat_rooms`: Primary index on `id`
- `messages`: Composite index on `(room_id, created_at DESC)`, index on `(room_id, sender_session_id, created_at DESC)`
- `reports`: Index on `room_id`, index on `created_at`

**pg_cron Cleanup Job**:
```sql
-- 期限切れチャットルームとメッセージの定期削除（1分ごと）
SELECT cron.schedule('cleanup-expired-rooms', '* * * * *', $$
  DELETE FROM messages WHERE room_id IN (
    SELECT id FROM chat_rooms WHERE expires_at < NOW() AND status = 'active'
  );
  UPDATE chat_rooms SET status = 'closed' WHERE expires_at < NOW() AND status = 'active';
$$);
```

### Data Contracts & Integration

**WebSocket Event Payloads**:

```typescript
// backend/src/domain/events/websocket.ts
import { z } from 'zod';

// --- UUID v4 バリデーションヘルパー ---
const uuidV4Schema = z.string().uuid({ version: 4 });

// --- Request Payloads (Client → Server) ---
export const RequestMatchSchema = z.object({});

export const SendMessageSchema = z.object({
  roomId: uuidV4Schema,
  text: z.string().min(1).max(500).transform(s => s.trim().replace(/<[^>]*>/g, '')),
});

export const LeaveRoomSchema = z.object({
  roomId: uuidV4Schema,
});

export const ReportContentSchema = z.object({
  roomId: uuidV4Schema,
  reason: z.enum(['spam', 'harassment', 'inappropriate_content', 'other']),
});

// --- Response Payloads (Server → Client) ---
export const MatchFoundSchema = z.object({
  roomId: uuidV4Schema,
  partnerSessionId: uuidV4Schema,
});

export const NewMessageSchema = z.object({
  messageId: uuidV4Schema,
  senderSessionId: uuidV4Schema,
  text: z.string(),
  createdAt: z.string().datetime(), // ISO 8601
});

export const MessageDeletedSchema = z.object({
  messageId: uuidV4Schema,
});

export const RoomClosedSchema = z.object({
  roomId: uuidV4Schema,
  reason: z.enum(['timeout', 'user_left', 'reported']),
});

export const PartnerDisconnectedSchema = z.object({
  roomId: uuidV4Schema,
});

export const TimerUpdateSchema = z.object({
  roomId: uuidV4Schema,
  remainingSeconds: z.number().int().nonnegative(),
});

export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

// --- 型推論 ---
export type SendMessagePayload = z.infer<typeof SendMessageSchema>;
export type ReportContentPayload = z.infer<typeof ReportContentSchema>;
export type MatchFoundPayload = z.infer<typeof MatchFoundSchema>;
export type NewMessagePayload = z.infer<typeof NewMessageSchema>;
export type RoomClosedPayload = z.infer<typeof RoomClosedSchema>;
export type ErrorPayload = z.infer<typeof ErrorSchema>;

// --- WebSocketGatewayで使用するバリデーションヘルパー ---
export function validatePayload<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Result<T, ValidationError> {
  const result = schema.safeParse(data);
  return result.success
    ? ok(result.data)
    : err(new ValidationError(result.error.issues.map(i => i.message).join(', ')));
}
```

**Validation Rules**:
- `text`: 1-500文字、空白除去、HTMLタグ除去（Zodのtransformで自動適用）
- `roomId`, `sessionId`: UUID v4形式（Zodのuuid()で検証）
- `reason`: Enum値のみ許可（Zodのenum()で検証）
- **実行時検証**: WebSocketGatewayで全イベント受信時に`validatePayload()`を使用して検証

**型共有戦略**:
- `backend/src/domain/events/websocket.ts`で定義
- フロントエンド（Web/Mobile）にはpnpm workspaceで共有パッケージとして提供
  - 共有パッケージ: `packages/shared-types/`に配置
  - `package.json`の`exports`フィールドでエクスポート
  - フロントエンドは`import { SendMessagePayload } from '@cha-chat/shared-types'`で利用

## Error Handling

### Error Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as WebSocket Gateway
    participant Service as Domain Service
    participant DB as Supabase/Redis
    participant ErrorHandler

    Client->>Gateway: sendMessage(payload)
    Gateway->>Gateway: validatePayload(SendMessageSchema)

    alt バリデーションエラー
        Gateway->>ErrorHandler: handleValidationError(error)
        ErrorHandler-->>Client: error(VALIDATION_ERROR)
    else バリデーション成功
        Gateway->>Service: sendMessage(...)
        Service->>DB: INSERT message

        alt データベースエラー（一時的）
            DB-->>Service: Error
            Service->>ErrorHandler: handleTransientError(error)
            ErrorHandler->>ErrorHandler: exponential backoff (最大3回)
            ErrorHandler->>DB: RETRY INSERT

            alt リトライ成功
                DB-->>Service: Success
                Service-->>Client: newMessage
            else リトライ失敗
                ErrorHandler-->>Client: error(DATABASE_ERROR)
            end
        else ビジネスロジックエラー
            Service-->>ErrorHandler: Result.err(ROOM_CLOSED)
            ErrorHandler-->>Client: error(ROOM_CLOSED, "再マッチングしてください")
        else 成功
            DB-->>Service: Success
            Service-->>Client: newMessage
        end
    end
```

### Error Categories and Responses

**User Errors (4xx)**:
- `VALIDATION_ERROR`: Zodバリデーション失敗（テキスト長超過、不正なUUID等）
  - **通知**: エラーイベント即座送信
  - **メッセージ**: 具体的な修正箇所を明示（例: "メッセージは500文字以内にしてください"）
  - **リトライ**: なし（ユーザー修正必須）
- `ROOM_CLOSED`: 終了済みルームにメッセージ送信
  - **通知**: エラーイベント + 再マッチングボタン表示
  - **メッセージ**: "チャットが終了しました。再度マッチングしますか？"
  - **リトライ**: なし

**System Errors (5xx)**:
- `DATABASE_ERROR`: Supabase接続エラー、クエリタイムアウト
  - **通知**: エラーイベント送信
  - **リトライ**: 指数バックオフ（1秒 → 2秒 → 4秒、最大3回）
  - **Circuit Breaker**: 連続10回失敗でサービス停止、30秒後に復旧試行
  - **メッセージ**: "サーバーエラーが発生しました。しばらくしてから再試行してください。"
- `REDIS_ERROR`: Redis接続エラー
  - **通知**: エラーイベント送信
  - **リトライ**: 指数バックオフ（最大3回）
  - **フォールバック**: マッチングキューのみメモリ管理に切り替え（一時的）
  - **メッセージ**: "マッチング処理でエラーが発生しました。再度お試しください。"
- `WEBSOCKET_ERROR`: WebSocket接続タイムアウト、切断
  - **通知**: クライアント側で自動検知
  - **リトライ**: 指数バックオフ（1秒 → 3秒 → 9秒、最大5回）
  - **メッセージ**: "接続が切断されました。再接続しています..."

**Business Logic Errors (422)**:
- `MATCHING_QUEUE_EMPTY`: マッチング相手なし
  - **通知**: `waiting`イベント送信（エラーではない）
  - **メッセージ**: "マッチング相手を探しています..."
  - **リトライ**: 他ユーザー参加まで待機
- `DUPLICATE_MATCH_REQUEST`: 重複マッチングリクエスト
  - **通知**: 現在の待機状態を再送信
  - **メッセージ**: "すでにマッチング待機中です"
  - **リトライ**: なし
- `ALREADY_REPORTED`: 同一ルームに重複報告
  - **通知**: エラーイベント送信
  - **メッセージ**: "すでに報告済みです"
  - **リトライ**: なし

### Error Handler Implementation

```typescript
// backend/src/infrastructure/error-handler.ts
import { Result, err } from 'neverthrow';
import { Socket } from 'socket.io';

export type ErrorCategory = 'VALIDATION' | 'TRANSIENT' | 'FATAL' | 'BUSINESS_LOGIC';

export interface ErrorContext {
  category: ErrorCategory;
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  traceId: string;
}

export class ErrorHandler {
  handleError(socket: Socket, error: ErrorContext): void {
    // 構造化ログ出力
    this.logError(error);

    // ユーザー通知
    socket.emit('error', {
      code: error.code,
      message: error.userMessage,
    });

    // メトリクス記録
    this.recordMetric(error.category, error.code);
  }

  async retryWithBackoff<T>(
    operation: () => Promise<Result<T, Error>>,
    maxRetries: number = 3
  ): Promise<Result<T, Error>> {
    for (let i = 0; i < maxRetries; i++) {
      const result = await operation();
      if (result.isOk()) return result;

      // 指数バックオフ
      await this.sleep(Math.pow(2, i) * 1000);
    }
    return err(new Error('Max retries exceeded'));
  }

  private logError(error: ErrorContext): void {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      category: error.category,
      code: error.code,
      message: error.message,
      traceId: error.traceId,
    }));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private recordMetric(category: ErrorCategory, code: string): void {
    // メトリクス記録ロジック（例: Prometheus）
  }
}
```

### Monitoring

- **ヘルスチェック**: `GET /health` — サーバー稼働状態、DB/Redis接続確認
- **エラーログ**: 構造化ログ（JSON形式） — timestamp, level, category, code, message, traceId
- **メトリクス**:
  - アクティブルーム数 — Gauge
  - 待機ユーザー数 — Gauge
  - メッセージレート — Counter
  - エラー発生率（カテゴリ別） — Counter
  - WebSocket接続数 — Gauge

## Testing Strategy

### Unit Tests
1. `MatchingService.tryMatch()`: 2ユーザーマッチング成功
2. `MessageService.sendMessage()`: メッセージ保存と4件目以降の削除
3. `MessageService.validateText()`: 空文字、500文字超過のバリデーション
4. `RoomManager.closeRoom()`: ルーム終了と全メッセージ削除
5. `SessionManager.generateSession()`: UUID v4形式のセッションID生成

### Integration Tests
1. マッチングからルーム作成までのフロー
2. メッセージ送信からブロードキャストまでのフロー
3. チャットルーム終了フロー
4. Redis待機キュー操作
5. Drizzle ORM + Supabase接続

### E2E/UI Tests
1. マッチングからチャット終了までの完全フロー
2. メッセージ自動削除のUI反映
3. 途中退出時の相手通知
4. レスポンシブデザイン確認

## Security Considerations

### 匿名性保護
- 個人情報の非収集: ユーザー名、メールアドレス等を一切収集しない
- セッション識別子: UUID v4による一意かつランダムな匿名識別子
- データ完全削除: チャットルーム終了時に全メッセージを削除

### データ保護
- 通信暗号化: WebSocket通信はTLS/SSL（WSS）で暗号化
- アクセス制御: ルーム参加者のセッションIDでアクセス権限チェック

### 脅威対策
- スパム攻撃: レート制限（1セッションあたり10メッセージ/分）
- XSS対策: HTMLタグ除去、特殊文字エスケープ

## Performance & Scalability

### Target Metrics
- WebSocket接続: 初期目標1000同時接続
- マッチング応答時間: 平均1秒以内
- メッセージ配信遅延: 平均100ms以内

### Scaling Approaches
- **水平スケーリング**: Socket.IO Redis Adapter導入
- **データベース**: Supabaseコネクションプール最適化

## Containerization & Deployment

### Docker Compose Architecture

Docker Composeを使用して、バックエンドとフロントエンド（Web版）をコンテナ上で動作させます。開発環境と本番環境の両方に対応した構成を提供します。

**コンテナ構成**:

```mermaid
graph TB
    subgraph DockerCompose[Docker Compose環境]
        Frontend[frontend-web<br/>Svelte Dev Server]
        Backend[backend<br/>Hono + Socket.IO]
        Redis[redis<br/>Alpine]

        Frontend -->|WebSocket| Backend
        Backend -->|キュー| Redis
        Backend -->|PostgreSQL| Supabase[External: Supabase]
    end

    Browser[ブラウザ] -->|http://localhost:5173| Frontend
    Browser -->|ws://localhost:3000| Backend
```

**コンテナ間通信**:
- frontendコンテナ: ポート5173（Vite Dev Server）
- backendコンテナ: ポート3000（Hono + Socket.IO）
- redisコンテナ: ポート6379（内部通信のみ）
- Supabase: 外部マネージドサービス（環境変数で接続）

### Docker Compose Configuration

#### compose.yaml

```yaml
services:
  # バックエンドサービス
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - redis
    command: pnpm run dev
    networks:
      - cha-chat-network

  # フロントエンド（Web版）サービス
  frontend-web:
    build:
      context: ./frontend/web
      dockerfile: Dockerfile
      target: development
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
      - VITE_WS_URL=ws://localhost:3000
    volumes:
      - ./frontend/web:/app
      - /app/node_modules
    depends_on:
      - backend
    command: pnpm run dev
    networks:
      - cha-chat-network

  # Redis（マッチングキュー用）
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    networks:
      - cha-chat-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  redis-data:

networks:
  cha-chat-network:
    driver: bridge
```

**Key Decisions**:
- **Multi-stage Dockerfile**: development/productionターゲットで環境を切り替え
- **Volume Mount**: ホットリロード対応のためソースコードをマウント
- **Health Check**: Redisの起動状態を監視
- **Bridge Network**: コンテナ間通信を分離

#### Backend Dockerfile

```dockerfile
# ベースイメージ: Node.js v24 LTS "Krypton"
FROM node:24-alpine AS base

# pnpmインストール
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 依存関係のインストール
FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 開発環境
FROM base AS development
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "dev"]

# ビルド
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# 本番環境
FROM base AS production
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Implementation Notes**:
- **Multi-stage Build**: 依存関係キャッシュを最大活用
- **Alpine Linux**: イメージサイズ最小化
- **pnpm**: 高速で効率的なパッケージマネージャー
- **Node.js 24 LTS**: 長期サポート保証

#### Frontend (Web) Dockerfile

```dockerfile
# ベースイメージ: Node.js v24 LTS
FROM node:24-alpine AS base

# pnpmインストール
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 依存関係のインストール
FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 開発環境
FROM base AS development
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["pnpm", "run", "dev", "--host"]

# ビルド
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# 本番環境（Nginx）
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Implementation Notes**:
- **開発モード**: Vite Dev Serverでホットリロード
- **本番モード**: 静的ファイルをNginxで配信
- **--host フラグ**: コンテナ外からのアクセスを許可

#### nginx.conf (本番環境用)

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPAルーティング対応
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静的ファイルのキャッシュ
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

### Environment Variables

#### .env.example

```bash
# Backend
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres
REDIS_URL=redis://redis:6379

# Frontend (Web)
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

**Security Notes**:
- `.env`ファイルは`.gitignore`に追加
- 本番環境では環境変数は外部から注入
- Supabase接続文字列は暗号化されたシークレット管理

### Development Workflow

#### ローカル開発開始

```bash
# 環境変数設定
cp .env.example .env
# DATABASE_URLをSupabaseの接続文字列に設定

# コンテナ起動
docker compose up -d

# ログ確認
docker compose logs -f

# 停止
docker compose down
```

#### コンテナ再ビルド

```bash
# 全コンテナ再ビルド
docker compose build --no-cache

# 特定コンテナのみ再ビルド
docker compose build backend
docker compose build frontend-web
```

#### トラブルシューティング

```bash
# コンテナ内でシェル実行
docker compose exec backend sh
docker compose exec frontend-web sh

# ボリュームクリア
docker compose down -v
```

### Production Deployment

本番環境では以下の追加設定が必要:

1. **環境変数**:
   - `NODE_ENV=production`
   - `DATABASE_URL`: Supabase本番接続文字列
   - `REDIS_URL`: マネージドRedis（例: Upstash）

2. **TLS/SSL**:
   - Nginx または Cloudflare で HTTPS 終端
   - WebSocket (WSS) 対応

3. **スケーリング**:
   - `docker compose up --scale backend=3`
   - Socket.IO Redis Adapter 有効化

4. **モニタリング**:
   - コンテナヘルスチェック
   - ログ集約（例: Loki, CloudWatch）
   - メトリクス収集（例: Prometheus）

### Compatibility Notes

**Docker Version Requirements**:
- Docker Engine: 20.10.0+
- Docker Compose: v2.0.0+

**Host System Requirements**:
- CPU: 2 cores minimum
- Memory: 4GB minimum
- Storage: 10GB minimum

**Supabase Connection**:
- Supabaseは外部マネージドサービスとして動作
- DATABASE_URL環境変数で接続
- PostgreSQL 15+ 互換

**Mobile Frontend**:
- Flutter (frontend/mobile) はコンテナ化対象外
- ネイティブビルドが必要なため、ホストマシンで直接実行
- APIエンドポイントは環境変数で設定
