# cha-chat

「ちゃちゃっと」気軽に会話できる、匿名チャットアプリケーション

## プロダクトコンセプト

- **完全匿名性**: ログイン不要、個人情報収集なし、アクセス即マッチング
- **一時性**: 10分間限定のチャットルーム、自分の3つ前より古いメッセージは自動削除
- **シンプルさ**: テキストのみ、ミニマルUI、即座にマッチング

## 技術スタック

### バックエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Node.js | v24.13.0 LTS "Krypton" | ランタイム |
| Hono | v4.11.8 | HTTPフレームワーク |
| Socket.IO | v4.8.3 | WebSocketサーバー |
| TypeScript | - | 開発言語 |
| MongoDB | - | データストア |
| Redis | - | マッチングキュー |

### フロントエンド（Web版）
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Svelte | v5.49.0 | UIフレームワーク |
| Vite | - | ビルドツール |
| socket.io-client | v4.8.3 | WebSocket通信 |
| Svelte Store | - | 状態管理 |

### フロントエンド（モバイル版）
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Flutter | v3.38.6 | UIフレームワーク |
| Dart | - | 開発言語 |
| socket_io_client | - | WebSocket通信 |
| Riverpod | - | 状態管理 |

## プロジェクト構成

```
cha-chat/
├── frontend/
│   ├── web/       # Webブラウザ版（Svelte）
│   └── mobile/    # モバイルアプリ版（Flutter）
└── backend/       # バックエンド（Hono + Socket.IO）
```

## 開発環境

- パッケージマネージャー: pnpm
- モノレポ管理: pnpm workspace
- リンター/フォーマッター: Biome

## 主要機能

1. **ユーザーマッチング**: FIFOキューベースの自動マッチング
2. **チャットルーム管理**: 10分タイマー、自動終了
3. **メッセージ送受信**: リアルタイム配信、テキストのみ
4. **メッセージ自動削除**: 自分の最新3件のみ保持
5. **マルチプラットフォーム**: Web/iOS/Android対応
6. **セキュリティ**: 完全匿名、チャット終了後データ完全削除

## 詳細ドキュメント

- ステアリング: `.kiro/steering/`
- 仕様書: `.kiro/specs/cha-chat/`

---

# AI-DLC（Spec-Driven Development）

## パス構成

| パス | 用途 |
|------|------|
| `.kiro/steering/` | プロジェクト全体のルールとコンテキスト |
| `.kiro/specs/` | 個別機能の仕様書 |

## ワークフロー

### Phase 0（任意）: ステアリング設定
```
/kiro:steering
/kiro:steering-custom
```

### Phase 1: 仕様策定
```
/kiro:spec-init "description"        # 仕様初期化
/kiro:spec-requirements {feature}    # 要件定義
/kiro:validate-gap {feature}         # 既存コードとのギャップ分析（任意）
/kiro:spec-design {feature} [-y]     # 設計
/kiro:validate-design {feature}      # 設計レビュー（任意）
/kiro:spec-tasks {feature} [-y]      # タスク分解
```

### Phase 2: 実装
```
/kiro:spec-impl {feature} [tasks]    # 実装
/kiro:validate-impl {feature}        # 実装検証（任意）
```

### 進捗確認
```
/kiro:spec-status {feature}          # いつでも使用可能
```

## 開発ルール

- **3フェーズ承認**: Requirements → Design → Tasks → Implementation
- **人間レビュー必須**: 各フェーズで確認、`-y`は意図的なファストトラック時のみ
- **ステアリング維持**: 常に最新状態を保ち、`/kiro:spec-status`で整合性を確認
- **自律的実行**: 指示の範囲内で自律的に行動し、本質的な情報不足や重大な曖昧さがある場合のみ質問

## 言語設定

- 思考は英語、出力は日本語
- プロジェクトファイル（requirements.md, design.md, tasks.md等）はspec.json.languageの設定に従う
