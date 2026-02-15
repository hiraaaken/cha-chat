# Backend - cha-chat

## 技術スタック

| 技術 | 用途 |
|------|------|
| Hono | HTTP フレームワーク |
| Socket.IO | WebSocket サーバー |
| Drizzle ORM | ORM + マイグレーション |
| Supabase (PostgreSQL) | データストア |
| Redis | マッチングキュー |
| neverthrow | Result 型によるエラーハンドリング |
| Vitest | テストフレームワーク |

## コーディング規約

`biome.json` に準拠する:

- `any` 禁止（`noExplicitAny: error`）
- インデント: 2 スペース
- 行幅: 100 文字
- クォート: シングルクォート
- 末尾カンマ: ES5 準拠

## ドメイン設計パターン

### Newtype Value Object

ブランド型で型安全な値オブジェクトを表現する。ファクトリ関数は `Result<T, ValidationError>` を返す。

```typescript
type RoomId = Newtype<'RoomId', string>;

function RoomId(value: string): Result<RoomId, ValidationError> {
  // バリデーション → ok(value as RoomId) or err(...)
}
```

### Entity

Union 型で状態遷移を表現する。

### エラーハンドリング

- `neverthrow` の `Result<T, E>` を使用
- `throw` は原則禁止、`Result` で伝搬する

## テスト規約

- フレームワーク: **Vitest**
- ファイル配置: テスト対象と同じディレクトリに `.test.ts` を配置（co-located）
- テスト説明: **日本語**で記述
- 実行: `pnpm test`

```typescript
describe('RoomId', () => {
  it('有効なUUID v4を受け付ける', () => { ... });
  it('無効な文字列を拒否する', () => { ... });
});
```

## 利用可能なエージェント

| エージェント | 用途 |
|-------------|------|
| `code-reviewer` | コードレビュー |
| `security-reviewer` | セキュリティレビュー |
| `tdd-guide` | TDD ガイダンス |
| `architect` | アーキテクチャ設計 |

## 利用可能なスキル

| スキル | 用途 |
|-------|------|
| `/tdd` | TDD サイクルで実装 |
