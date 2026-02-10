# Requirements Document

## Project Description (Input)
匿名のユーザー同士がマッチングして10分間だけチャットできるチャットルームが作成される。テキストのみのやりとりができます。自身が投稿した３つ前より前のメッセージは消えてしまう、実際の会話に近いようなチャットができるアプリです。

## Introduction
Cha-Chatは、匿名ユーザー同士が気軽に会話できる即席チャットアプリケーションです。10分間の制限時間と、3つ前より古いメッセージが自動削除される仕組みにより、リアルタイムの会話に近い体験を提供します。

## Requirements

### Requirement 1: ユーザーマッチング機能
**Objective:** As a ユーザー, I want 他の匿名ユーザーと自動的にマッチングされる機能, so that 簡単にチャット相手を見つけられる

#### Acceptance Criteria
1. When ユーザーがマッチングをリクエストした, the Cha-Chat システム shall 待機中の他のユーザーと自動的にペアリングする
2. When マッチング可能なユーザーがいない, the Cha-Chat システム shall ユーザーを待機キューに追加する
3. When マッチングが成立した, the Cha-Chat システム shall 新しいチャットルームを作成する
4. The Cha-Chat システム shall マッチングは完全に匿名で行う（個人情報を共有しない）

### Requirement 2: チャットルーム管理
**Objective:** As a ユーザー, I want 10分間限定のチャットルームで会話できる, so that 短時間で気軽なコミュニケーションができる

#### Acceptance Criteria
1. When チャットルームが作成された, the Cha-Chat システム shall 10分間のタイマーを開始する
2. While チャットルームが有効な間, the Cha-Chat システム shall 残り時間を両ユーザーに表示する
3. When 10分が経過した, the Cha-Chat システム shall チャットルームを自動的に終了する
4. When チャットルームが終了した, the Cha-Chat システム shall すべてのメッセージを削除する
5. If いずれかのユーザーが途中退出した, then the Cha-Chat システム shall もう一方のユーザーに通知し、チャットルームを終了する

### Requirement 3: メッセージ送受信機能
**Objective:** As a ユーザー, I want テキストメッセージを送受信できる, so that 相手とリアルタイムでコミュニケーションできる

#### Acceptance Criteria
1. When ユーザーがメッセージを送信した, the Cha-Chat システム shall メッセージを即座に相手ユーザーに配信する
2. The Cha-Chat システム shall テキストのみの送信を許可する（画像、動画、ファイル等は不可）
3. When メッセージが送信された, the Cha-Chat システム shall 送信時刻を記録する
4. The Cha-Chat システム shall 各メッセージに送信者識別子（自分/相手）を付与する
5. If メッセージ送信に失敗した, then the Cha-Chat システム shall ユーザーにエラーを通知する

### Requirement 4: メッセージ自動削除機能
**Objective:** As a ユーザー, I want 古いメッセージが自動的に消える仕組み, so that 実際の会話に近い一時性のある体験ができる

#### Acceptance Criteria
1. When 新しいメッセージが送信された, the Cha-Chat システム shall 各ユーザーの表示メッセージ履歴を評価する
2. When ユーザー自身が送信したメッセージが4つ以上存在する, the Cha-Chat システム shall 最も古い自分のメッセージを削除する
3. The Cha-Chat システム shall 自分が送信した最新3件のメッセージのみを保持する
4. The Cha-Chat システム shall 相手のメッセージは削除対象としない（相手が自分で送ったメッセージのみ相手側で削除される）
5. While メッセージが削除される, the Cha-Chat システム shall UIから即座に非表示にする

### Requirement 5: マルチプラットフォーム対応
**Objective:** As a ユーザー, I want Webブラウザとモバイルアプリの両方でアクセスできる, so that 自分の好きなデバイスでいつでもチャットできる

#### Acceptance Criteria
1. The Cha-Chat システム shall Webブラウザ版のフロントエンドを提供する
2. The Cha-Chat システム shall モバイルアプリ版のフロントエンドを提供する
3. The Cha-Chat システム shall WebとモバイルアプリでUI/UXの一貫性を保つ
4. The Cha-Chat システム shall 両プラットフォームで同一のバックエンドAPIを使用する
5. When ユーザーがいずれかのプラットフォームからアクセスした, the Cha-Chat システム shall 同一のマッチングプールで相手を探す
6. The Cha-Chat システム shall レスポンシブデザインによりWeb版を各種画面サイズに対応させる

### Requirement 6: ユーザーインターフェース
**Objective:** As a ユーザー, I want シンプルで直感的なインターフェース, so that ストレスなくチャットを楽しめる

#### Acceptance Criteria
1. The Cha-Chat システム shall チャットルームの残り時間をカウントダウン表示する
2. The Cha-Chat システム shall 自分のメッセージと相手のメッセージを視覚的に区別できるよう表示する
3. When ユーザーがメッセージ入力中, the Cha-Chat システム shall テキスト入力フィールドと送信ボタンを提供する
4. The Cha-Chat システム shall 現在表示中のメッセージ一覧をリアルタイムで更新する
5. When チャットが終了した, the Cha-Chat システム shall ユーザーに終了を通知し、新しいマッチングを促す
6. The Cha-Chat システム shall Web版とモバイルアプリ版で同等の機能を提供する

### Requirement 7: セキュリティとプライバシー
**Objective:** As a ユーザー, I want 匿名性が保護される, so that 安心して会話できる

#### Acceptance Criteria
1. The Cha-Chat システム shall ユーザーの個人情報（名前、メールアドレス等）を収集しない
2. The Cha-Chat システム shall 各チャットセッションで一意の匿名識別子を生成する
3. When チャットルームが終了した, the Cha-Chat システム shall すべてのメッセージ履歴を完全に削除する
4. The Cha-Chat システム shall チャットルーム外のユーザーがメッセージにアクセスできないよう保護する
5. The Cha-Chat システム shall 不適切なコンテンツ（スパム、ハラスメント等）を報告する機能を提供する

