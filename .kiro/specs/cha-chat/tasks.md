# 実装タスク

このドキュメントは、cha-chat機能の実装タスクを定義します。design.mdのImplementation Phasesに従って段階的に実装を進めます。

## タスクの進め方

- 各タスクは1-3時間程度で完了できるサイズに分割されています
- `(P)`マークがついているタスクは並行実行可能です
- Phase 0から順番に実装し、各フェーズで動作確認を行います
- MVP Scopeを優先し、Future Enhancementsは後続フェーズで対応します

---

## Phase 0: プロジェクト雛形とインフラストラクチャ基盤

### - [x] 1. モノレポ構成とプロジェクト初期化
- [x] 1.1 (P) pnpm workspaceの設定
  - ルートディレクトリに`pnpm-workspace.yaml`を作成
  - backend、frontend/web、frontend/mobile、packages/*をワークスペースに追加
  - ルートの`package.json`にワークスペース管理用スクリプトを追加
  - _Requirements: 5.4_

- [x] 1.2 (P) 共有型パッケージの初期化
  - `packages/shared-types/`ディレクトリを作成
  - package.jsonとtsconfig.jsonを設定
  - エクスポート用のindex.tsを作成
  - WebSocketイベント型の骨組みを定義
  - _Requirements: 5.4_

### - [x] 2. バックエンドプロジェクトの雛形作成
- [x] 2.1 バックエンドディレクトリ構造の構築
  - `backend/src/`配下にdomain、application、infrastructureディレクトリを作成
  - domain層に entities、types、eventsディレクトリを作成
  - application層に services、interfacesディレクトリを作成
  - infrastructure層に http、websocket、database、cacheディレクトリを作成
  - _Requirements: 5.4_

- [x] 2.2 TypeScript設定とビルド環境
  - `backend/package.json`を作成（Hono、Socket.IO、Drizzle ORM、neverthrow、zod等の依存関係）
  - `backend/tsconfig.json`を作成（厳格な型チェック設定）
  - `backend/biome.json`を作成（リンター/フォーマッター設定）
  - ビルド・開発スクリプトをpackage.jsonに追加
  - _Requirements: 5.4_

- [x] 2.3 Hono最小構成の実装
  - `backend/src/index.ts`にエントリポイントを作成
  - `backend/src/infrastructure/http/honoServer.ts`にHonoサーバー初期化コードを実装
  - ヘルスチェックエンドポイント`GET /health`を実装（ステータスとタイムスタンプを返す）
  - 環境変数（PORT、NODE_ENV）を読み込む設定
  - _Requirements: 5.4_

### - [ ] 3. データベースとキャッシュの接続確認
- [ ] 3.1 (P) Supabase接続とDrizzle ORM初期設定
  - `backend/src/infrastructure/database/drizzle.ts`にDrizzle ORM接続設定を実装
  - 環境変数`DATABASE_URL`からPostgreSQL接続情報を取得
  - 接続確認用のヘルパー関数を実装
  - `backend/src/db/schema.ts`に空のスキーマファイルを作成
  - drizzle.config.tsを作成してマイグレーション設定を追加
  - _Requirements: 5.4_

- [ ] 3.2 (P) Redis接続の実装
  - `backend/src/infrastructure/cache/redis.ts`にRedis接続設定を実装
  - 環境変数`REDIS_URL`から接続情報を取得
  - 接続確認とエラーハンドリングを実装
  - pingコマンドで接続状態を確認できる機能を追加
  - _Requirements: 1.2_

- [ ] 3.3 Docker Compose環境での動作確認
  - `docker compose up`でbackend、redis、frontend-webコンテナが起動することを確認
  - `GET /health`でバックエンドのヘルスチェックが成功することを確認
  - Redis接続が正常に確立されることを確認
  - Supabase接続が正常に確立されることを確認
  - _Requirements: 5.4_

---

## Phase 1: WebSocket基本接続とセッション管理

### - [ ] 4. ドメイン型定義の実装
- [ ] 4.1 基盤型の定義
  - `backend/src/domain/types/base.ts`にNewtype定義とValidationErrorクラスを実装
  - neverthrowのResult型を活用した型安全なエラーハンドリング基盤を構築
  - _Requirements: 7.2_

- [ ] 4.2 値オブジェクトの定義
  - `backend/src/domain/types/valueObjects.ts`にRoomId、SessionId、MessageId、MessageText、ReportReason、SocketIdのファクトリ関数を実装
  - 各値オブジェクトにバリデーションロジックを追加（UUID v4形式、文字数制限、HTMLタグ除去等）
  - _Requirements: 3.2, 4.3, 7.1, 7.2_

- [ ] 4.3 セッションエンティティの定義
  - `backend/src/domain/entities/session.ts`にSession、MatchingStatus（Waiting、Matched）の型定義を実装
  - ファクトリ関数（createSession、createWaiting、createMatched）を実装
  - _Requirements: 1.4, 7.2_

### - [ ] 5. WebSocketサーバーとセッション管理の実装
- [ ] 5.1 Socket.IOサーバーの統合
  - `backend/src/infrastructure/websocket/websocketGateway.ts`にSocket.IOサーバー初期化コードを実装
  - HonoのHTTPサーバーとSocket.IOサーバーを同一HTTPサーバー上で統合
  - 接続（connection）、切断（disconnect）イベントのハンドラーを実装
  - WebSocketイベントスキーマ（Zod）の基本構造を実装
  - _Requirements: 3.1, 5.4_

- [ ] 5.2 SessionManagerの実装
  - `backend/src/application/services/sessionManager.ts`にSessionManagerを実装
  - WebSocket接続時にUUID v4で匿名セッションIDを生成する機能
  - セッションとSocketIdの紐付け管理機能
  - セッション無効化機能
  - _Requirements: 1.4, 7.1, 7.2_

- [ ] 5.3 接続テスト用の簡易HTMLページ作成
  - `backend/public/test-client.html`にSocket.IO接続テスト用のHTMLページを作成
  - 接続成功時にセッションIDを表示
  - 接続/切断ボタンとログ表示エリアを実装
  - Honoで静的ファイル配信を設定
  - _Requirements: 5.1, 5.4_

- [ ] 5.4 WebSocket接続の動作確認
  - ブラウザでtest-client.htmlにアクセスし、WebSocket接続が成功することを確認
  - セッションIDが正常に発行されることを確認
  - 複数ブラウザで同時接続し、各ブラウザに異なるセッションIDが発行されることを確認
  - 切断時に適切にクリーンアップされることを確認
  - _Requirements: 3.1, 7.2_

---

## Phase 2: マッチング機能

### - [ ] 6. チャットルームエンティティとイベントの定義
- [ ] 6.1 チャットルームエンティティの定義
  - `backend/src/domain/entities/chatRoom.ts`にChatRoom（Union型: ActiveChatRoom、ClosedChatRoom）を定義
  - ファクトリ関数（createActiveChatRoom、closeChatRoom）を実装
  - RoomCloseReason型（timeout、user_left、reported）を定義
  - _Requirements: 2.1, 2.3, 2.4_

- [ ] 6.2 ドメインイベントの定義
  - `backend/src/domain/events/index.ts`にDomainEvent型（MatchFoundEvent、MessageSentEvent、MessageDeletedEvent、RoomClosedEvent、PartnerDisconnectedEvent）を定義
  - 各イベントに必要なフィールド（roomId、sessionId、occurredAt等）を追加
  - _Requirements: 1.3, 2.4, 3.1_

### - [ ] 7. データベーススキーマの作成
- [ ] 7.1 Drizzleスキーマの定義
  - `backend/src/db/schema.ts`にchat_rooms、messages、reportsテーブルのスキーマを定義
  - chat_roomsテーブル: id (UUID PK), user1_session_id, user2_session_id, created_at, expires_at, status
  - messagesテーブル: id (UUID PK), room_id (FK), sender_session_id, text, created_at
  - reportsテーブル: id (UUID PK), room_id, reporter_session_id, reason, created_at
  - リレーション定義（chatRoomsRelations、messagesRelations）を追加
  - _Requirements: 2.1, 3.3, 7.3_

- [ ] 7.2 マイグレーションの実行
  - `drizzle-kit generate`でマイグレーションファイルを生成
  - `drizzle-kit migrate`でSupabaseにスキーマを適用
  - インデックス作成（messages: room_id + created_at DESC、room_id + sender_session_id + created_at DESC）
  - pg_cronを使用した期限切れルームの自動削除ジョブを設定
  - _Requirements: 2.3, 2.4, 4.2_

### - [ ] 8. マッチングサービスの実装
- [ ] 8.1 MatchingServiceインターフェースと実装
  - `backend/src/application/interfaces/matchingServiceInterface.ts`にインターフェースを定義
  - `backend/src/application/services/matchingService.ts`にMatchingServiceを実装
  - enqueueUser: ユーザーをRedis待機キュー（LPUSH）に追加
  - tryMatch: キューから2ユーザーを取得（RPOP x2）し、マッチング成立時にRoomManagerを呼び出し
  - _Requirements: 1.1, 1.2, 5.5_

- [ ] 8.2 WebSocketGatewayへのマッチングイベント統合
  - `requestMatch`イベント受信時にMatchingService.enqueueUserを呼び出し
  - マッチング成立時にMatchFoundEventを両ユーザーに配信
  - 待機中の場合は`waiting`イベントを送信
  - エラーハンドリング（重複リクエスト、キューエラー等）を実装
  - _Requirements: 1.1, 1.2, 1.3_

### - [ ] 9. RoomManagerの実装（MVP Scope - シンプルなタイマー）
- [ ] 9.1 RoomManagerインターフェースと基本実装
  - `backend/src/application/interfaces/roomManagerInterface.ts`にインターフェースを定義
  - `backend/src/application/services/roomManager.ts`にRoomManagerを実装
  - createRoom: チャットルームをSupabaseに作成し、10分タイマーをsetTimeoutで開始
  - closeRoom: ルーム状態を'closed'に更新し、タイマーをクリア
  - getRoom、getRoomStatus: ルーム情報を取得
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 9.2 タイマー管理機能の実装
  - ルーム作成時にexpiresAtを10分後に設定
  - 1分ごとに残り時間を計算し、`timerUpdate`イベントを両ユーザーに配信
  - 10分経過時に自動的にcloseRoomを呼び出し、`roomClosed`イベントを配信
  - タイマーIDをメモリ管理し、ルーム終了時にclearTimeoutを実行
  - _Requirements: 2.1, 2.2, 2.3, 6.1_

- [ ] 9.3 ユーザー切断時の処理
  - handleUserDisconnect: 切断ユーザーのセッションIDを受け取り、相手に`partnerDisconnected`イベントを配信
  - ルームを即座にcloseし、タイマーをクリア
  - WebSocketGatewayのdisconnectイベントハンドラから呼び出し
  - _Requirements: 2.5_

### - [ ] 10. マッチング機能の動作確認
- [ ] 10.1 マッチング成立のテスト
  - 2つのブラウザでtest-client.htmlを開き、両方で`requestMatch`イベントを送信
  - 両ブラウザが`matchFound`イベントを受信し、同じroomIdが配信されることを確認
  - Supabaseのchat_roomsテーブルに新しいレコードが作成されることを確認
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 10.2 タイマー機能のテスト
  - マッチング成立後、`timerUpdate`イベントが1分ごとに配信されることを確認
  - 10分経過後（またはタイマーを短縮して）`roomClosed`イベントが配信されることを確認
  - chat_roomsテーブルのstatusが'closed'に更新されることを確認
  - _Requirements: 2.1, 2.2, 2.3, 6.1_

---

## Phase 3: メッセージ送受信と自動削除

### - [ ] 11. メッセージエンティティとイベントスキーマの実装
- [ ] 11.1 メッセージエンティティの定義
  - `backend/src/domain/entities/message.ts`にMessage型とcreateMessageファクトリ関数を実装
  - MessageId、RoomId、SessionId、MessageText、createdAtフィールドを含む
  - _Requirements: 3.3, 3.4_

- [ ] 11.2 WebSocketイベントスキーマの完成
  - `backend/src/domain/events/websocket.ts`にZodスキーマを実装
  - SendMessageSchema、NewMessageSchema、MessageDeletedSchemaを定義
  - validatePayloadヘルパー関数を実装し、実行時バリデーションを提供
  - 型推論（z.infer）でTypeScript型を生成
  - _Requirements: 3.1, 3.2, 3.5_

- [ ] 11.3 共有型パッケージへの型定義追加
  - `packages/shared-types/src/events.ts`にWebSocketイベント型（SendMessagePayload、NewMessagePayload等）をエクスポート
  - フロントエンドから`import { SendMessagePayload } from '@cha-chat/shared-types'`で利用可能にする
  - _Requirements: 5.4_

### - [ ] 12. MessageServiceの実装
- [ ] 12.1 MessageServiceインターフェースと基本実装
  - `backend/src/application/interfaces/messageServiceInterface.ts`にインターフェースを定義
  - `backend/src/application/services/messageService.ts`にMessageServiceを実装
  - sendMessage: メッセージをSupabaseに保存し、SendMessageResult（message、event、deletedMessages）を返す
  - getMessages: 指定ルームのメッセージ一覧を取得
  - deleteAllMessages: ルーム終了時に全メッセージを削除
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 12.2 メッセージ自動削除ロジックの実装
  - deleteOldMessages: 指定ユーザーの送信メッセージ数をカウント
  - 4件以上存在する場合、最も古いメッセージを削除
  - sendMessage内でメッセージ保存後にdeleteOldMessagesを自動呼び出し
  - 削除されたメッセージのMessageDeletedEventをリストで返す
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 12.3 WebSocketGatewayへのメッセージイベント統合
  - `sendMessage`イベント受信時にZodバリデーションを実行
  - MessageService.sendMessageを呼び出し、結果をroom内にブロードキャスト
  - 新規メッセージは`newMessage`イベントで配信
  - 削除メッセージは`messageDeleted`イベントで送信者のみに配信
  - エラー発生時は`error`イベントを送信
  - _Requirements: 3.1, 3.5, 4.5_

### - [ ] 13. チャットルーム終了処理の統合
- [ ] 13.1 RoomManagerとMessageServiceの連携
  - RoomManager.closeRoom内でMessageService.deleteAllMessagesを呼び出し
  - ルーム終了時にすべてのメッセージがSupabaseから削除されることを保証
  - トランザクション処理でルーム状態更新とメッセージ削除を一括実行
  - _Requirements: 2.4, 7.3_

- [ ] 13.2 `leaveRoom`イベントの実装
  - WebSocketGatewayで`leaveRoom`イベントを受信
  - RoomManager.handleUserDisconnectを呼び出し
  - 相手ユーザーに`roomClosed`イベントを配信
  - ユーザーが明示的に退出した場合のフローを確立
  - _Requirements: 2.5_

### - [ ] 14. メッセージ送受信機能の動作確認
- [ ] 14.1 メッセージ送受信のテスト
  - test-client.htmlにメッセージ入力フィールドと送信ボタンを追加
  - マッチング成立後、テキストメッセージを送信
  - 両ブラウザで`newMessage`イベントを受信し、メッセージが表示されることを確認
  - Supabaseのmessagesテーブルにレコードが作成されることを確認
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 14.2 メッセージ自動削除のテスト
  - 同一ユーザーから4件以上のメッセージを送信
  - 4件目送信時に1件目のメッセージが削除され、`messageDeleted`イベントが配信されることを確認
  - UIから1件目のメッセージが非表示になることを確認
  - 相手のメッセージは削除されないことを確認
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 14.3 チャットルーム終了時のデータ削除テスト
  - ルームが終了（タイムアウトまたは手動退出）した際に、Supabaseのmessagesテーブルから該当ルームのメッセージがすべて削除されることを確認
  - chat_roomsテーブルのstatusが'closed'に更新されることを確認
  - _Requirements: 2.4, 7.3_

---

## Phase 4: フロントエンド実装

### - [ ] 15. Web版フロントエンド（Svelte）の基本構成
- [ ] 15.1 (P) Svelteプロジェクトの初期化
  - `frontend/web/`にSvelte + Viteプロジェクトを作成
  - `frontend/web/package.json`にsocket.io-client、@cha-chat/shared-types等の依存関係を追加
  - `frontend/web/vite.config.ts`を設定（VITE_API_URL、VITE_WS_URLの環境変数対応）
  - `frontend/web/tsconfig.json`を設定
  - _Requirements: 5.1, 5.6_

- [ ] 15.2 (P) Socket.IOクライアントの実装
  - `frontend/web/src/lib/websocket/socketClient.ts`にSocket.IO接続管理クラスを実装
  - connect、disconnect、emit、onメソッドを提供
  - 自動再接続機能を有効化
  - _Requirements: 5.1, 5.4_

### - [ ] 16. Svelte Storeによる状態管理
- [ ] 16.1 チャット状態のStore実装
  - `frontend/web/src/lib/stores/chatStore.ts`にchatStoreを実装
  - 現在のチャット状態（waiting、matched、chatting、closed）を管理
  - roomId、partnerSessionId、remainingSecondsを保持
  - _Requirements: 2.2, 6.1_

- [ ] 16.2 メッセージ状態のStore実装
  - `frontend/web/src/lib/stores/messageStore.ts`にmessageStoreを実装
  - メッセージ一覧（配列）を管理
  - addMessage、removeMessage、clearMessagesメソッドを提供
  - _Requirements: 3.1, 4.5, 6.4_

- [ ] 16.3 接続状態のStore実装
  - `frontend/web/src/lib/stores/connectionStore.ts`にconnectionStoreを実装
  - WebSocket接続状態（connected、disconnected、reconnecting）を管理
  - sessionIdを保持
  - _Requirements: 5.1_

### - [ ] 17. UIコンポーネントの実装
- [ ] 17.1 (P) マッチング待機画面コンポーネント
  - マッチングリクエストボタンを配置
  - 待機中のローディング表示
  - `requestMatch`イベントを送信し、`waiting`または`matchFound`イベントを受信
  - _Requirements: 1.1, 6.5_

- [ ] 17.2 (P) チャットルームコンポーネント
  - `frontend/web/src/components/ChatRoom.svelte`を実装
  - メッセージ一覧表示エリア
  - メッセージ入力フィールドと送信ボタン
  - 残り時間カウントダウン表示
  - 退出ボタン
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 17.3 (P) メッセージリストコンポーネント
  - `frontend/web/src/components/MessageList.svelte`を実装
  - 自分のメッセージと相手のメッセージを視覚的に区別（背景色、配置等）
  - メッセージ削除時に該当メッセージをUIから即座に非表示
  - スクロール制御（新規メッセージで自動スクロール）
  - _Requirements: 6.2, 6.4, 4.5_

- [ ] 17.4 (P) タイマー表示コンポーネント
  - `frontend/web/src/components/Timer.svelte`を実装
  - 残り時間を「MM:SS」形式で表示
  - `timerUpdate`イベントを受信して表示を更新
  - 残り時間が1分を切ったら警告色で表示
  - _Requirements: 2.2, 6.1_

### - [ ] 18. Web版フロントエンドの動作確認
- [ ] 18.1 マッチングフローのE2Eテスト
  - 2つのブラウザでWeb版アプリを開き、両方でマッチングリクエスト
  - マッチング成立画面に遷移し、チャットルームが表示されることを確認
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 18.2 チャット機能のE2Eテスト
  - テキストメッセージを送受信し、両ブラウザで正しく表示されることを確認
  - 自分のメッセージと相手のメッセージが視覚的に区別されることを確認
  - 4件以上送信時に古いメッセージが自動削除されることを確認
  - _Requirements: 3.1, 4.1, 6.2, 6.4_

- [ ] 18.3 レスポンシブデザインの確認
  - PC、タブレット、スマートフォンの各画面サイズでUIが適切に表示されることを確認
  - ブラウザウィンドウのリサイズ時にレイアウトが崩れないことを確認
  - _Requirements: 5.6_

### - [ ] 19. モバイル版フロントエンド（Flutter）の実装
- [ ] 19.1 (P) Flutterプロジェクトの初期化
  - `frontend/mobile/`にFlutterプロジェクトを作成
  - `pubspec.yaml`にsocket_io_client、riverpod等の依存関係を追加
  - iOS/Androidの最小ターゲットバージョンを設定
  - _Requirements: 5.2_

- [ ] 19.2 (P) Socket.IOクライアントの実装
  - Socket.IO接続管理クラスを実装
  - WebSocket URL（VITE_WS_URL相当）を環境変数または設定から取得
  - 接続、切断、イベント送受信機能を実装
  - _Requirements: 5.2, 5.4_

- [ ] 19.3 (P) Riverpodによる状態管理
  - chatRoomProvider、messageListProvider、connectionStateProviderを実装
  - Web版と同等の状態管理ロジックを提供
  - _Requirements: 5.3_

- [ ] 19.4 (P) UIスクリーンの実装
  - マッチング待機画面、チャットルーム画面を実装
  - Web版と同等のUI要素を配置（メッセージ一覧、入力フィールド、タイマー表示）
  - iOS/Androidのネイティブウィジェットを使用
  - _Requirements: 5.2, 5.3, 6.1, 6.2, 6.3_

- [ ] 19.5 モバイル版の動作確認
  - iOS/Androidシミュレーター/実機でアプリを起動
  - Web版と同時にマッチングし、相互にメッセージ送受信ができることを確認
  - UI/UXがWeb版と一貫性を持つことを確認
  - _Requirements: 5.2, 5.3, 5.5, 6.6_

---

## Phase 5: セキュリティ、エラーハンドリング、オプショナル機能

### - [ ] 20. セキュリティ機能の実装
- [ ] 20.1 (P) 不適切コンテンツ報告機能
  - `backend/src/domain/entities/report.ts`にReport型とファクトリ関数を実装
  - `backend/src/application/services/reportService.ts`にReportServiceを実装
  - submitReport: 報告をSupabaseに保存
  - WebSocketGatewayで`reportContent`イベントを受信し、ReportServiceを呼び出し
  - _Requirements: 7.5_

- [ ] 20.2 (P) レート制限の実装
  - メッセージ送信時に1セッションあたり10メッセージ/分のレート制限を適用
  - Redisでセッションごとのカウンターを管理（INCR、EXPIRE）
  - 制限超過時は`error`イベントでユーザーに通知
  - _Requirements: 7.5_

- [ ] 20.3 (P) XSS対策の強化
  - MessageTextファクトリ関数でHTMLタグ除去に加えて特殊文字エスケープを実装
  - フロントエンドでもメッセージ表示時にエスケープ処理を適用
  - _Requirements: 7.5_

### - [ ] 21. エラーハンドリングとモニタリング
- [ ] 21.1 ErrorHandlerの実装
  - `backend/src/infrastructure/error-handler.ts`にErrorHandlerクラスを実装
  - handleError: エラーカテゴリ（VALIDATION、TRANSIENT、FATAL、BUSINESS_LOGIC）に応じた処理
  - retryWithBackoff: 指数バックオフによるリトライ機能
  - 構造化ログ出力（JSON形式）
  - _Requirements: 3.5_

- [ ] 21.2 Circuit Breakerの実装
  - データベースエラーやRedisエラーに対するCircuit Breaker機構
  - 連続10回失敗でサービス停止、30秒後に復旧試行
  - _Requirements: 3.5_

- [ ] 21.3 ヘルスチェックエンドポイントの拡張
  - `GET /health`にDB接続状態、Redis接続状態、アクティブルーム数、待機ユーザー数を含める
  - 各サービスの稼働状態を確認し、異常時は503ステータスを返す
  - _Requirements: 5.4_

### - [ ] 22. Future Enhancements（オプショナル - Phase 5以降）
- [ ] 22.1 タイマー復元機能の実装
  - RoomManager.restoreActiveTimersを実装
  - ルーム作成時にRedisに`room:timer:{roomId}`を保存（HSET + EXPIRE 600）
  - サーバー起動時に`KEYS room:timer:*`で全タイマーを取得し、setTimeoutを復元
  - ルーム終了時にRedisからタイマー情報を削除
  - _Requirements: 2.1_

- [ ] 22.2 Socket.IO Redis Adapterの統合
  - Socket.IOにRedis Adapterを設定
  - 複数バックエンドサーバー間でWebSocketイベントを共有
  - 水平スケーリング対応を実現
  - _Requirements: 5.4_

- [ ] 22.3 メトリクス収集の実装
  - Prometheusクライアントを統合
  - アクティブルーム数、待機ユーザー数、メッセージレート、エラー発生率を収集
  - `/metrics`エンドポイントを実装
  - _Requirements: 5.4_

---

## 要件カバレッジサマリー

以下のすべての要件が上記タスクでカバーされています：

- **Requirement 1 (ユーザーマッチング機能)**: 1.1, 1.2, 1.3, 1.4 → タスク8, 10
- **Requirement 2 (チャットルーム管理)**: 2.1, 2.2, 2.3, 2.4, 2.5 → タスク6, 7, 9, 10, 13
- **Requirement 3 (メッセージ送受信機能)**: 3.1, 3.2, 3.3, 3.4, 3.5 → タスク11, 12, 14, 21
- **Requirement 4 (メッセージ自動削除機能)**: 4.1, 4.2, 4.3, 4.4, 4.5 → タスク12, 14
- **Requirement 5 (マルチプラットフォーム対応)**: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6 → タスク1, 2, 3, 5, 15, 19
- **Requirement 6 (ユーザーインターフェース)**: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6 → タスク17, 18, 19
- **Requirement 7 (セキュリティとプライバシー)**: 7.1, 7.2, 7.3, 7.5 → タスク4, 5, 7, 13, 20

**合計**: 22 メジャータスク、88 サブタスク
