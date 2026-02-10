# Research & Design Decisions

## Summary
- **Feature**: cha-chat
- **Discovery Scope**: New Feature（グリーンフィールド）
- **Key Findings**:
  - Supabase + Drizzle ORMの組み合わせは公式サポートされており、`postgres`ドライバー経由で接続
  - Hono + Socket.IOの統合は`@hono/node-server`と`node:http`サーバー共有で実現可能
  - PostgreSQLのpg_cronを使用してチャットルームとメッセージの定期削除を実装

## Research Log

### Drizzle ORM + Supabase 統合

- **Context**: MongoDBからSupabase（PostgreSQL）への移行に伴い、ORMの選定が必要
- **Sources Consulted**:
  - [Drizzle with Supabase Tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase)
  - [Drizzle ORM Documentation](https://orm.drizzle.team/docs)
- **Findings**:
  - Drizzleは`postgres`ドライバーを使用してSupabaseに接続
  - スキーマ定義は`drizzle-orm/pg-core`の関数を使用
  - リレーション定義は`relations`関数で宣言的に記述
  - マイグレーションは`drizzle-kit generate`と`drizzle-kit migrate`で管理
- **Implications**:
  - `DATABASE_URL`環境変数でSupabase接続文字列を管理
  - スキーマファイルは`backend/src/db/schema.ts`に配置
  - マイグレーションファイルは`backend/drizzle/`に出力

### Hono + Socket.IO 統合

- **Context**: HonoフレームワークとSocket.IOを同一サーバーで動作させる方法の調査
- **Sources Consulted**:
  - [Hono Node.js Getting Started](https://hono.dev/docs/getting-started/nodejs)
  - [Socket.IO with Hono patterns](https://github.com/honojs/website)
- **Findings**:
  - `@hono/node-server`を使用してNode.jsサーバーを起動
  - Socket.IOは`node:http`サーバーを共有することで統合
  - Honoの`upgradeWebSocket`ヘルパーはSocket.IOとは別機能
  - 統合パターン: HTTPサーバーを作成 → Hono fetchハンドラを設定 → Socket.IOをアタッチ
- **Implications**:
  - `node:http.createServer`でHTTPサーバーを作成
  - `@hono/node-server/server`のfetchハンドラを使用
  - Socket.IOサーバーを同一HTTPサーバーにアタッチ

### PostgreSQLでのTTL実装

- **Context**: MongoDBのTTLインデックスに相当する機能をPostgreSQLで実現
- **Sources Consulted**:
  - Supabase pg_cron documentation
  - PostgreSQL scheduled jobs best practices
- **Findings**:
  - PostgreSQLにはネイティブのTTL機能がない
  - `pg_cron`拡張機能を使用して定期削除ジョブを実装
  - Supabaseではpg_cronがプリインストール済み
  - 代替: アプリケーションレベルでの定期削除タスク
- **Implications**:
  - チャットルーム終了時に明示的にメッセージ削除
  - pg_cronで1分ごとに期限切れデータをクリーンアップ（フェイルセーフ）
  - `expires_at`カラムを使用して削除対象を判定

### Redis マッチングキュー

- **Context**: マッチング待機キューの実装方法
- **Sources Consulted**:
  - Redis documentation (LPUSH/RPOP)
  - ioredis npm package
- **Findings**:
  - FIFOキューはRedisのList型（LPUSH/RPOP）で実装
  - アトミック操作で競合状態を回避
  - セッション情報はHash型で管理可能
- **Implications**:
  - `ioredis`パッケージを使用
  - キー設計: `waiting_queue`（List）、`session:{id}`（Hash）
  - 接続プールで効率的なコネクション管理

### Docker Compose コンテナ化

- **Context**: backendとfrontend/webをコンテナ上で動作させる開発環境の構築
- **Sources Consulted**:
  - Docker Compose v2 specification
  - Docker multi-stage builds best practices
  - Node.js Docker production best practices (2026)
- **Findings**:
  - Docker Compose v2では`compose.yaml`が推奨（`docker-compose.yml`より優先）
  - Multi-stage Dockerfileで開発/本番環境を分離（`target`指定）
  - pnpmはCorepackで有効化（Node.js 24にプリインストール）
  - Volume mountでホットリロードを実現（`/app/node_modules`を除外）
  - Redis 7-alpineでイメージサイズ最小化
  - Health checkでサービス起動順序を保証
- **Implications**:
  - `compose.yaml`をルートディレクトリに配置
  - `backend/Dockerfile`と`frontend/web/Dockerfile`を個別に作成
  - 開発環境: `docker compose up`で即座に起動
  - 本番環境: `target: production`で最適化されたイメージをビルド
  - Supabaseは外部マネージドサービスとして接続（コンテナ化しない）

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| シンプルレイヤード + イベント駆動 | 3層アーキテクチャ + WebSocketイベント | 理解しやすい、実装速度が速い | 大規模化時のスケーラビリティ | 現在の選択 |
| Clean Architecture | ドメイン中心の依存性逆転 | テスト容易性、保守性 | 初期オーバーヘッド | 将来の拡張時に検討 |
| マイクロサービス | 機能ごとの独立サービス | スケーラビリティ | 運用複雑性 | 現時点では過剰 |

## Design Decisions

### Decision: Drizzle ORM採用

- **Context**: PostgreSQL（Supabase）へのアクセス方法の選定
- **Alternatives Considered**:
  1. Supabase Client直接使用 — シンプル、学習コスト低
  2. Drizzle ORM — 型安全、マイグレーション管理
  3. Prisma — フル機能ORM、やや重い
- **Selected Approach**: Drizzle ORM + drizzle-kit
- **Rationale**:
  - TypeScriptとの親和性が高く、型安全なクエリが可能
  - 軽量で依存関係が少ない
  - スキーマファーストの開発スタイルに適合
  - Supabaseとの公式統合ガイドが存在
- **Trade-offs**:
  - 学習コストはSupabase Clientより高い
  - 一部の高度なPostgreSQL機能はraw SQLが必要
- **Follow-up**: マイグレーションワークフローの確立

### Decision: Hono + Socket.IO 統合方式

- **Context**: HTTPフレームワークとWebSocketサーバーの統合
- **Alternatives Considered**:
  1. Hono upgradeWebSocket — Honoネイティブ、シンプル
  2. Socket.IO + 共有HTTPサーバー — 機能豊富、room管理
  3. ws + Hono — 軽量、低レベル制御
- **Selected Approach**: Socket.IO + 共有HTTPサーバー
- **Rationale**:
  - Socket.IOのroom機能がチャットルーム管理に最適
  - 自動再接続、フォールバック機能が組み込み
  - モバイル版（Flutter）との互換性が高い
- **Trade-offs**:
  - Honoの軽量さを一部犠牲にする
  - Socket.IOのオーバーヘッドが発生
- **Follow-up**: 接続数が増加した場合のRedis Adapter検討

### Decision: pg_cron による定期削除

- **Context**: チャットルーム・メッセージの自動削除機構
- **Alternatives Considered**:
  1. pg_cron — DB層で完結、信頼性高
  2. Node.js cron job — アプリ層、柔軟性高
  3. Supabase Edge Functions + cron — サーバーレス
- **Selected Approach**: pg_cron + アプリケーション層の明示的削除
- **Rationale**:
  - チャット終了時は即座に明示的削除
  - pg_cronはフェイルセーフとして機能
  - DB層で完結するため信頼性が高い
- **Trade-offs**:
  - pg_cronの最小実行間隔は1分
  - デバッグがやや困難
- **Follow-up**: 削除ログの監視機構

### Decision: Docker Compose + Multi-stage Dockerfile

- **Context**: 開発環境のコンテナ化とデプロイメント戦略
- **Alternatives Considered**:
  1. Docker Compose + Multi-stage Dockerfile — 標準的、開発/本番共通
  2. Dockerfile のみ — シンプル、手動起動
  3. Kubernetes — 大規模向け、初期オーバーヘッド大
- **Selected Approach**: Docker Compose + Multi-stage Dockerfile
- **Rationale**:
  - `docker compose up`で開発環境を即座に起動
  - Multi-stageで開発/本番環境を同一ファイルで管理
  - pnpmとNode.js 24 LTSを活用
  - Redisをコンテナ化して依存関係を簡素化
  - Supabaseは外部サービスとして接続（コスト効率）
- **Trade-offs**:
  - Kubernetesほどのスケーラビリティはない
  - 初期セットアップでDockerの知識が必要
- **Follow-up**: 本番環境でのオーケストレーション検討（必要に応じて）

## Risks & Mitigations

- **サーバー再起動時のタイマー消失** — Redisにタイマー情報（expiresAt）を永続化し、サーバー起動時に復元。具体的には：
  - ルーム作成時: `HSET room:timer:{roomId} expiresAt {timestamp}` + `EXPIRE 600`
  - 起動時: `KEYS room:timer:*`で全タイマーを取得し、残り時間を計算してsetTimeoutを復元
  - ルーム終了時: `DEL room:timer:{roomId}`
  - pg_cronが1分ごとに期限切れルームをクリーンアップ（フェイルセーフ）
- **大量同時接続時のパフォーマンス** — Redis Adapter導入でSocket.IOをスケールアウト
- **Supabase接続制限** — コネクションプール設定の最適化
- **pg_cronの遅延** — 明示的削除を優先し、pg_cronはバックアップとして運用

## References

- [Drizzle ORM with Supabase](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase) — Supabase統合ガイド
- [Hono Node.js](https://hono.dev/docs/getting-started/nodejs) — Node.jsセットアップ
- [Socket.IO Documentation](https://socket.io/docs/v4/) — Socket.IO v4リファレンス
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron) — 定期ジョブ設定
- [ioredis](https://github.com/redis/ioredis) — Node.js Redisクライアント
