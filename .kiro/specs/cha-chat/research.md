# 調査・設計決定ドキュメント

---
**目的**: ディスカバリーの発見、アーキテクチャ調査、技術設計に関する根拠を記録する。

**使用方法**:
- ディスカバリーフェーズで調査活動と結果を記録
- design.mdに詳細すぎる設計決定のトレードオフを文書化
- 将来の監査や再利用のための参照と証拠を提供
---

## Summary
- **Feature**: `cha-chat`
- **Discovery Scope**: New Feature（新規機能・グリーンフィールド）
- **Key Findings**:
  - マルチプラットフォーム対応（Web: Svelte、Mobile: Flutter）とNode.js WebSocketバックエンドの組み合わせは実績があり実現可能
  - MongoDBのTTLインデックスを使用してメッセージの自動削除が可能
  - 匿名マッチングにはキューベースのアルゴリズムとRedisなどの高速データストアの併用が推奨される
  - pnpm workspaceモノレポは主にJavaScript/TypeScriptプロジェクト向けだが、Flutterは独自のpub管理が必要
  - **技術スタック最新バージョン（2026年2月時点）**: Hono v4.11.8、Node.js v24 LTS、Socket.IO v4.8.3、Svelte v5.49.0、Flutter v3.38.6、MongoDB Node.js Driver v7.1.0
  - HonoはWebSocket対応可能（@hono/node-ws）、Socket.IOとの統合もNode.js環境で動作確認済み

## Research Log

### Hono + WebSocket + Socket.IO統合

- **Context**: バックエンドフレームワークとしてHonoを採用、WebSocket/Socket.IO対応を調査
- **Sources Consulted**:
  - [WebSocket Helper - Hono](https://hono.dev/docs/helpers/websocket)
  - [Hono supports Socket.io? · honojs · Discussion #1781](https://github.com/orgs/honojs/discussions/1781)
  - [@hono/node-ws - npm](https://www.npmjs.com/package/@hono/node-ws)
  - [Support for Bun + Socket.io + Hono Integration · Issue #4127 · honojs/hono](https://github.com/honojs/hono/issues/4127)
- **Findings**:
  - Honoは最新版v4.11.8（2026年2月時点）
  - WebSocketサポート: `@hono/node-ws` v1.3.0パッケージでNode.js環境にてWebSocket対応可能
  - Socket.IO統合: Node.js環境では動作するが、Socket.IOリクエストを通常のHonoルートとは別に処理する必要がある
  - Bunでの制約: BunとSocket.IOとHonoの3つの統合には互換性の課題があるが、Node.jsでは問題なし
  - HonoはWeb Standards準拠で、軽量かつ高速なフレームワーク
- **Implications**:
  - バックエンドはHono + Node.js v24 LTS
  - Socket.IO v4.8.3を使用し、Honoアプリケーションと並行して動作
  - Honoで通常のHTTPエンドポイント、Socket.IOでWebSocketリアルタイム通信を処理
  - 必要に応じて`@hono/node-ws`でネイティブWebSocketも利用可能

### 最新バージョン確認（2026年2月）

- **Context**: 全技術スタックの最新安定版を確認
- **Sources Consulted**:
  - [Hono - npm](https://www.npmjs.com/package/hono)
  - [Node.js — Node.js Releases](https://nodejs.org/en/about/previous-releases)
  - [Socket.IO - npm](https://www.npmjs.com/package/socket.io)
  - [Svelte Releases](https://github.com/sveltejs/svelte/releases)
  - [Flutter SDK archive](https://docs.flutter.dev/install/archive)
  - [MongoDB Node.js Driver - npm](https://www.npmjs.com/package/mongodb)
- **Findings**:
  - **Node.js**: v24.13.0 LTS "Krypton"（2026年1月13日リリース、2028年4月までサポート）
  - **Hono**: v4.11.8（2026年2月最新）
  - **Socket.IO**: v4.8.3（2025年12月リリース）
  - **Svelte**: v5.49.0（2026年1月28日リリース）、Runes、Snippets、改善されたTypeScriptサポート
  - **Flutter**: v3.38.6（2026年1月14日リリース）、v3.41が2026年2月予定
  - **MongoDB Node.js Driver**: v7.1.0、最低Node.js v20.19.0が必要
- **Implications**:
  - 全スタックで2026年時点の最新安定版を採用
  - Node.js v24 LTSで長期サポート確保
  - Svelte 5のRunesとSnippetsを活用した最新のリアクティブシステム
  - Flutter 3.38でiOS 26、Xcode 26、macOS 26完全対応
  - MongoDB Driver v7で最新BSON機能とパフォーマンス改善

### Svelte + WebSocketによるリアルタイムチャット実装

- **Context**: Web版フロントエンドでのWebSocket統合方法を調査
- **Sources Consulted**:
  - [Build a Real-Time Chat App with WebSockets - DEV Community](https://dev.to/gingermuffn/build-a-real-time-chat-app-with-websockets-1om8)
  - [Master WebSockets in Svelte: Eliminate Common Pitfalls](https://infinitejs.com/posts/master-websockets-svelte-eliminate-pitfalls/)
  - [Using WebSockets With SvelteKit](https://joyofcode.xyz/using-websockets-with-sveltekit)
  - [Implementing WebSockets in a SvelteKit (Version 5)](https://medium.com/@vinay.s.khanagavi/implementing-websockets-in-a-sveltekit-version-5-1d6c6041e9ca)
- **Findings**:
  - SvelteKitでWebSocketsを使用するには、Vite開発サーバーにフックするプラグインが必要（開発時）
  - WebSocketライフサイクル管理（接続確立、再接続、切断、エラーリカバリー）が重要
  - 状態管理はSvelteのストアと統合が容易（約3分で実装可能）
  - WebSocket接続ロジックは専用ファイルに分離し、複数コンポーネントで再利用する設計が推奨
  - 最小限のデータ転送とサーバーサイドフィルタリングでパフォーマンス最適化
- **Implications**:
  - Web版はSvelteKitのViteプラグインでWebSocketを統合
  - WebSocket接続管理モジュールを共通化してコンポーネント間で再利用
  - ストアベースの状態管理でリアルタイム更新を実現

### Flutter + WebSocketによるリアルタイムチャット実装

- **Context**: モバイル版フロントエンドでのWebSocket統合方法を調査
- **Sources Consulted**:
  - [How to Build a Real-Time Chat App in Flutter Using WebSockets](https://medium.com/@AkindeleMichael/how-to-build-a-real-time-chat-app-in-flutter-using-websockets-03d39fd052d8)
  - [Real Time Chat App With WebSocket| Flutter&NestJS](https://medium.com/@ocakirsaz/real-time-chat-app-with-websocket-flutter-nestjs-65ec6429066a)
  - [Building Real-Time Apps with Flutter and WebSockets: A Comprehensive Guide](https://medium.com/@samra.sajjad0001/building-real-time-apps-with-flutter-and-websockets-a-comprehensive-guide-f4e78f6648a7)
  - [Building realtime apps with Flutter and WebSockets: client-side considerations](https://ably.com/topic/websockets-flutter)
- **Findings**:
  - `web_socket_channel`パッケージが標準的な選択肢
  - `socket_io_client`パッケージとRiverpodの組み合わせも人気
  - WebSocket実装はコアパート（接続、リスニング、送信、状態管理）に分割すると管理しやすい
  - プロダクションレベルでは以下が推奨:
    - Streamsを公開する回復力のあるクライアントでWebSocketをラップ
    - Isolatesを使用してメインスレッドから大きなペイロードを解析
    - 指数バックオフ+ジッターとハートビート機構による再接続
- **Implications**:
  - モバイル版は`web_socket_channel`パッケージを採用
  - 状態管理にはRiverpodまたはProviderを使用
  - エラーハンドリングと再接続ロジックを堅牢に実装

### Node.js + WebSocket + MongoDBによるバックエンドアーキテクチャ

- **Context**: バックエンドサーバーの実装パターンを調査
- **Sources Consulted**:
  - [Building a real-time chat application using Node.js, MongoDB, and Express](https://dev.to/manthanank/building-a-real-time-chat-application-using-nodejs-mongodb-and-express-3bhp)
  - [Build a Real-Time Chat App with Node.js, Express, Socket.IO, and MongoDB](https://www.bomberbot.com/nodejs/how-to-build-a-real-time-chat-app-with-node-js-express-socket-io-and-mongodb/)
  - [Building a real-time scalable chat app using Socket.io, node js, Redis, Kafka, MongoDB, and react](https://arrehman.hashnode.dev/building-a-real-time-scalable-chat-app-using-socketio-node-js-redis-kafka-mongodb-and-react)
- **Findings**:
  - Socket.IOはリアルタイム双方向イベントベース通信を実現するライブラリ
  - 典型的な構成:
    - Node.js + Express.js: 基盤とSocket.IOサーバー
    - MongoDB: チャットメッセージの永続化
    - Mongoose: 非同期環境でのMongoDB操作
  - スケーラビリティ向上のための高度なアーキテクチャ（2025-2026年）:
    - Redisのpub-subでサーバー間通信
    - Kafkaをメッセージキューとして使用
    - チャット履歴キャッシュで頻繁にアクセスされる会話を高速取得
- **Implications**:
  - バックエンドはNode.js + Express + Socket.IO（またはネイティブWebSocket）
  - MongoDBで永続化、必要に応じてRedisでキャッシュ
  - 初期実装はシンプルに、スケーラビリティが必要になったらRedis/Kafkaを追加

### 匿名チャットマッチングアルゴリズム

- **Context**: 匿名ユーザーマッチングのアルゴリズムとアーキテクチャを調査
- **Sources Consulted**:
  - [Building a real-time anonymous chat platform: vibechat.gr's backend architecture](https://vibechat.gr/blog/backend-architecture.html)
  - [How I Built a Voice Chat App Using Anonymous Matching and Real-Time WebSockets](https://dev.to/aloovoicechat/how-i-built-a-voice-chat-app-using-anonymous-matching-and-real-time-websockets-1akg)
  - [Platform for pseudo-anonymous video chat with intelligent matching of chat partners - Google Patents](https://patents.google.com/patent/WO2012116197A3/en)
- **Findings**:
  - マッチングアルゴリズムは公平性と高並行性を考慮
  - 複数要因の考慮:
    - ユーザーランキング
    - 共通の興味・関連する興味
    - 会話の長さ
    - 共通の友人（このプロジェクトでは不要）
  - 機械学習で会話の長さと共通点を監視し、重み付けを動的に調整
  - 興味駆動型マッチング（完全ランダムではなくトピック選択）が会話品質を向上
  - アーキテクチャ:
    - PostgreSQLまたはMongoDBをプライマリデータストアに
    - Redisで高頻度操作を処理
    - バックグラウンドワーカーで非同期マッチング処理
  - セキュリティ:
    - ユーザー列挙攻撃の防止
    - 認証操作のタイミング一貫性
    - AIによる行動監視（報告後だけでなくマッチング中）
- **Implications**:
  - 初期実装はシンプルなFIFOキューベースのマッチング
  - 待機キューはRedisまたはMongoDBで管理
  - 将来的に興味ベースのマッチングやスコアリングシステムを追加可能
  - バックグラウンドワーカーでマッチング処理を非同期化

### MongoDB TTLインデックスによる自動削除

- **Context**: 10分後のメッセージ自動削除機能の実装方法を調査
- **Sources Consulted**:
  - [TTL Indexes - MongoDB Docs](https://www.mongodb.com/docs/manual/core/index-ttl/)
  - [Delete expired documents automatically with MongoDB (TTL index)](https://dev.to/lironer/delete-expired-documents-automatically-with-mongodb-ttl-index-l44)
  - [Using TTL Indexes in MongoDB to Automate Data Cleanup](https://medium.com/@vaishak610/effortless-log-management-using-ttl-indexes-in-mongodb-to-automate-data-cleanup-f6596ce5f00f)
  - [Expire Data from Collections by Setting TTL - MongoDB Docs](https://www.mongodb.com/docs/manual/tutorial/expire-data/)
- **Findings**:
  - TTLインデックスは指定時間経過後に自動的にドキュメントを削除する特殊なシングルフィールドインデックス
  - バックグラウンドスレッドが約60秒ごとに期限切れドキュメントを削除
  - BSON date型のフィールドが必要（文字列や他の型では動作しない）
  - 実装例:
    ```javascript
    db.messages.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 600 }  // 10分 = 600秒
    )
    ```
  - 重要な考慮事項:
    - 即座に削除されるわけではない（最大60秒の遅延）
    - シングルスレッドのバックグラウンドタスク
    - レプリカセットではprimaryメンバーでのみ削除
    - データ復旧不可能（削除されたら完全に消失）
- **Implications**:
  - チャットルーム終了時にメッセージを削除する方式と、TTLインデックスによる自動削除の2つのアプローチ
  - 推奨: チャットルーム終了時に明示的に削除 + TTLインデックスをフェイルセーフとして併用
  - メッセージドキュメントに`createdAt: Date`フィールドを持たせ、TTLインデックスを設定

### pnpm Workspaceモノレポ構成

- **Context**: モノレポでWeb（Svelte）、Mobile（Flutter）、Backend（Node.js）を管理する方法を調査
- **Sources Consulted**:
  - [Workspace | pnpm](https://pnpm.io/workspaces)
  - [Setting up a Monorepo using PNPM workspaces with TypeScript and Tailwind](https://blog.emmanuelisenah.com/setting-up-a-monorepo-using-pnpm-workspaces-with-typescript-and-tailwind)
  - [Complete Monorepo Guide: pnpm + Workspace + Changesets (2025)](https://jsdev.space/complete-monorepo-guide/)
  - [SvelteKit in Production: A Technical Leader's Guide to Monorepo Excellence](https://oestechnology.co.uk/posts/sveltekit-monorepo-excellence)
- **Findings**:
  - pnpm workspaceは複数プロジェクトを単一リポジトリで管理
  - `pnpm-workspace.yaml`ファイルでワークスペースを定義
  - 典型的な構造: `apps/`, `packages/`, `tools/`ディレクトリ
  - `workspace:*`プロトコルでローカルパッケージを参照
  - SvelteKitアプリケーションと共有コンポーネントライブラリの統合が容易
  - **Flutter統合の制限**:
    - Flutterは独自のパッケージ管理（pub/pubspec.yaml）を使用
    - JavaScriptベースのモノレポツール（pnpm）とは直接互換性がない
    - ハイブリッドアプローチが必要: FlutterプロジェクトはJavaScript/TypeScriptプロジェクトと並存するが、別管理
- **Implications**:
  - `frontend/web/`と`backend/`はpnpm workspaceで管理
  - `frontend/mobile/`（Flutter）は独立したプロジェクトとして管理（pubspec.yaml）
  - 共通の型定義やAPIスキーマは`packages/`に配置し、可能な範囲で共有
  - Flutterは別途`flutter pub get`などで依存関係を管理

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| クリーンアーキテクチャ | ドメインロジックを中心に、外部依存を分離 | テスト容易性、保守性、ドメインロジックの独立性 | 小規模プロジェクトではオーバーエンジニアリング | 将来のスケール拡大を見越すなら適切 |
| シンプルMVC/レイヤードアーキテクチャ | コントローラー、サービス、リポジトリの3層構造 | シンプル、学習コストが低い、実装が早い | ドメインロジックがサービス層に集中しがち | 初期実装に適切、必要に応じてリファクタリング |
| イベント駆動アーキテクチャ | WebSocketイベントを中心にした非同期処理 | リアルタイム性が高い、スケーラビリティ | イベント管理の複雑さ、デバッグが難しい | WebSocket中心のプロジェクトに適合 |
| **選択: シンプルレイヤードアーキテクチャ + イベント駆動要素** | サービス層でビジネスロジック、WebSocketイベントで通信 | 実装速度とリアルタイム性のバランス | 将来的なリファクタリングが必要になる可能性 | 初期実装に最適、ステアリング原則に整合 |

## Design Decisions

### Decision: バックエンドフレームワークの選択

- **Context**: Node.jsバックエンドフレームワークの選択
- **Alternatives Considered**:
  1. Express.js — 成熟したフレームワーク、豊富なエコシステム
  2. Hono — 軽量高速、Web Standards準拠、モダンなAPI
  3. Fastify — 高パフォーマンス、プラグインシステム
- **Selected Approach**: Hono v4.11.8
- **Rationale**:
  - 軽量かつ高速（Web Standards準拠）
  - モダンなTypeScript対応
  - Socket.IOとの統合が可能（Node.js環境）
  - シンプルなAPIで学習コストが低い
  - 将来的に他のランタイム（Bun、Deno等）への移行も視野に入れやすい
- **Trade-offs**:
  - 利点: パフォーマンス、軽量、モダンなAPI、柔軟性
  - 妥協: Expressほどエコシステムが成熟していない
- **Follow-up**: Socket.IO統合のベストプラクティスを実装フェーズで確立

### Decision: バックエンドWebSocket実装方法

- **Context**: Socket.IOかネイティブWebSocketか
- **Alternatives Considered**:
  1. Socket.IO — 高レベルAPIライブラリ、自動再接続、room管理機能
  2. ネイティブWebSocket (@hono/node-ws) — 低レベルAPI、軽量、制御性が高い
- **Selected Approach**: Socket.IO v4.8.3（Honoと並行動作）
- **Rationale**:
  - チャットルーム管理機能が組み込み
  - 自動再接続とフォールバック機能
  - Web版（Svelte）とモバイル版（Flutter）両方でクライアントライブラリが利用可能
  - 開発速度の向上
  - HonoとSocket.IOは独立して動作可能
- **Trade-offs**:
  - 利点: 実装速度、機能豊富、エコシステムが成熟
  - 妥協: 若干のオーバーヘッド、ネイティブWebSocketより重い
- **Follow-up**: パフォーマンス要件が厳しくなった場合、@hono/node-wsへの移行を検討

### Decision: フロントエンド状態管理

- **Context**: Web版（Svelte）とモバイル版（Flutter）での状態管理方法
- **Alternatives Considered**:
  1. Svelte: Svelte Store（組み込み） vs Context API
  2. Flutter: Riverpod vs Provider vs Bloc
- **Selected Approach**:
  - Web版: Svelte Store
  - モバイル版: Riverpod
- **Rationale**:
  - Svelte Store: Svelte標準、シンプル、リアクティブ性が高い
  - Riverpod: 型安全、テスト容易性、Providerの改良版
- **Trade-offs**:
  - 利点: 各プラットフォームで最適化された方法、学習コスト低い
  - 妥協: プラットフォーム間で状態管理の実装が異なる
- **Follow-up**: APIクライアントロジックを可能な限り共通化し、状態管理の差異を最小化

### Decision: マッチングアルゴリズムの初期実装

- **Context**: 匿名ユーザーマッチングの実装方針
- **Alternatives Considered**:
  1. シンプルFIFOキュー — 待機順にマッチング
  2. 興味ベースマッチング — ユーザーが選んだトピックでマッチング
  3. スコアリングシステム — 複数要因を考慮した高度なマッチング
- **Selected Approach**: シンプルFIFOキュー（初期実装）
- **Rationale**:
  - プロダクトの初期フェーズは「完全匿名・気軽さ」が優先
  - 実装が最もシンプルで迅速
  - 将来的に興味ベースやスコアリングシステムへ拡張可能
- **Trade-offs**:
  - 利点: 開発速度、シンプルさ、匿名性の保護
  - 妥協: 会話品質の最適化は後回し
- **Follow-up**: ユーザーフィードバックに基づいて興味ベースマッチングやスコアリングを追加検討

### Decision: メッセージ削除の実装方法

- **Context**: 「自分が送信した3つ前より古いメッセージを削除」と「チャットルーム終了後の完全削除」
- **Alternatives Considered**:
  1. クライアント側でのみ削除表示 — サーバーには残す
  2. サーバー側で即座に削除 — データベースから完全削除
  3. ハイブリッド — サーバー削除 + TTLインデックスをフェイルセーフに
- **Selected Approach**: ハイブリッド（サーバー削除 + TTLインデックス）
- **Rationale**:
  - プライバシー保護の観点からサーバー側でも削除が必要
  - TTLインデックスでフェイルセーフ（万が一削除処理が失敗した場合）
  - チャットルーム終了時に明示的に全メッセージを削除
  - 各メッセージ送信時に古いメッセージを削除（3件以上の場合）
- **Trade-offs**:
  - 利点: セキュリティ、プライバシー、データ保持ポリシー遵守
  - 妥協: 若干の実装複雑度増加
- **Follow-up**: 削除ロジックのテストを徹底的に実施

## Risks & Mitigations

- **リスク1: WebSocket接続の安定性** — 提案緩和策: 自動再接続ロジック、ハートビート機構、接続状態の監視とユーザーへの通知
- **リスク2: マッチング待機時間が長い（ユーザーが少ない場合）** — 提案緩和策: タイムアウト設定、待機状態の明確な表示、マッチング失敗時の再試行促進
- **リスク3: MongoDBのTTL削除遅延（最大60秒）** — 提案緩和策: チャットルーム終了時に明示的に削除、TTLはフェイルセーフとして位置づけ
- **リスク4: FlutterとJavaScript/TypeScript間の型共有が困難** — 提案緩和策: OpenAPI/JSON Schemaでスキーマを定義し、各言語用のコードを生成
- **リスク5: スパムや不適切なコンテンツ** — 提案緩和策: 報告機能の実装、将来的にAIベースのコンテンツモデレーション導入を検討

## References

### Official Documentation
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [MongoDB TTL Indexes](https://www.mongodb.com/docs/manual/core/index-ttl/)
- [Expire Data from Collections by Setting TTL - MongoDB](https://www.mongodb.com/docs/manual/tutorial/expire-data/)

### Technical Tutorials & Guides
- [Build a Real-Time Chat App with WebSockets - DEV Community](https://dev.to/gingermuffn/build-a-real-time-chat-app-with-websockets-1om8)
- [Master WebSockets in Svelte: Eliminate Common Pitfalls](https://infinitejs.com/posts/master-websockets-svelte-eliminate-pitfalls/)
- [Using WebSockets With SvelteKit](https://joyofcode.xyz/using-websockets-with-sveltekit)
- [How to Build a Real-Time Chat App in Flutter Using WebSockets](https://medium.com/@AkindeleMichael/how-to-build-a-real-time-chat-app-in-flutter-using-websockets-03d39fd052d8)
- [Building Real-Time Apps with Flutter and WebSockets: A Comprehensive Guide](https://medium.com/@samra.sajjad0001/building-real-time-apps-with-flutter-and-websockets-a-comprehensive-guide-f4e78f6648a7)
- [Building a real-time chat application using Node.js, MongoDB, and Express](https://dev.to/manthanank/building-a-real-time-chat-application-using-nodejs-mongodb-and-express-3bhp)
- [Building a real-time scalable chat app using Socket.io, node js, Redis, Kafka, MongoDB, and react](https://arrehman.hashnode.dev/building-a-real-time-scalable-chat-app-using-socketio-node-js-redis-kafka-mongodb-and-react)

### Architecture & Patterns
- [Building a real-time anonymous chat platform: vibechat.gr's backend architecture](https://vibechat.gr/blog/backend-architecture.html)
- [How I Built a Voice Chat App Using Anonymous Matching and Real-Time WebSockets](https://dev.to/aloovoicechat/how-i-built-a-voice-chat-app-using-anonymous-matching-and-real-time-websockets-1akg)
- [Complete Monorepo Guide: pnpm + Workspace + Changesets (2025)](https://jsdev.space/complete-monorepo-guide/)
- [SvelteKit in Production: A Technical Leader's Guide to Monorepo Excellence](https://oestechnology.co.uk/posts/sveltekit-monorepo-excellence)
