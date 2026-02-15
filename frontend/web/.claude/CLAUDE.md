# Frontend Web - cha-chat

## 技術スタック

| 技術 | 用途 |
|------|------|
| Svelte v5 | UI フレームワーク（Runes API） |
| Vite | ビルドツール |
| TypeScript | 開発言語 |
| socket.io-client | WebSocket 通信 |
| Svelte Store | 状態管理 |
| Vitest | テストフレームワーク |
| @testing-library/svelte | コンポーネントテスト |

## コーディング規約

`biome.json`（ルートレベル）に準拠する:

- `any` 禁止（`noExplicitAny: error`）
- インデント: 2 スペース
- 行幅: 100 文字
- クォート: シングルクォート
- 末尾カンマ: ES5 準拠

## アーキテクチャ

### ディレクトリ構成

```
src/
├── components/    # Svelte コンポーネント（UI 部品）
├── stores/        # Svelte Store（状態管理）
├── services/      # サービス層（API 通信、Socket.IO 接続）
├── types/         # TypeScript 型定義
└── lib/           # 共通ユーティリティ
```

### コンポーネント設計

- Svelte v5 の Runes API（`$state`, `$derived`, `$effect`）を使用する
- コンポーネントは小さく保ち、単一責務にする
- Props は `$props()` で受け取る
- イベントは Callback Props パターンで伝搬する

### 状態管理

- グローバル状態は Svelte Store で管理する
- コンポーネントローカルの状態は `$state` を使用する
- Store は `stores/` ディレクトリに配置する

### サービス層

- Socket.IO クライアントの接続管理は `services/` に集約する
- API 通信ロジックをコンポーネントから分離する

## テスト規約

- フレームワーク: **Vitest** + **@testing-library/svelte**
- ファイル配置: テスト対象と同じディレクトリに `.test.ts` を配置（co-located）
- テスト説明: **日本語**で記述
- 実行: `pnpm test`

```typescript
describe('ChatMessage', () => {
  it('メッセージテキストを表示する', () => { ... });
  it('送信者のメッセージは右寄せで表示する', () => { ... });
});
```

## 利用可能なエージェント

| エージェント | 用途 |
|-------------|------|
| `code-reviewer` | コードレビュー |
| `tdd-guide` | TDD ガイダンス |
| `architect` | アーキテクチャ設計 |

## 利用可能なスキル

| スキル | 用途 |
|-------|------|
| `/tdd` | TDD サイクルで実装 |
