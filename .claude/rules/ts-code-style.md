# TypeScript コーディング規約

## イミュータブル

### `const` を既定とする

変数宣言は常に `const` を使用する。再代入が必要な場合のみ `let` を使用し、`var` は禁止。

### オブジェクトを直接変更しない

状態遷移はスプレッド構文で新しいオブジェクトを生成する。プロパティの直接書き換えは行わない。

```typescript
// Good
function closeChatRoom(room: ActiveChatRoom, reason: RoomCloseReason): ClosedChatRoom {
  return { ...room, _tag: 'ClosedChatRoom', closedAt: new Date(), closeReason: reason };
}

// Bad
room._tag = 'ClosedChatRoom';
```

### `readonly` を活用する

インターフェースのプロパティは可能な限り `readonly` にする。配列は `readonly T[]` または `ReadonlyArray<T>` を使用する。

## 型安全性

### `any` 禁止

`any` は使用しない（Biome の `noExplicitAny: error` で強制）。型が不明な場合は `unknown` を使い、型ガードで narrowing する。

### `type` インポートを使い分ける

型のみのインポートには `import type` を使用する。

```typescript
// Good
import type { RoomId, SessionId } from '../types/valueObjects';
import { type Result, err, ok } from 'neverthrow';

// Bad
import { RoomId, SessionId } from '../types/valueObjects';
```

### Non-null assertion (`!`) を避ける

`!` の使用は最小限にする（Biome の `noNonNullAssertion: warn`）。代わりにガード節や Optional chaining (`?.`) を使用する。

### Union 型で状態を表現する

ブール値フラグの組み合わせではなく、Union 型で状態を明示する。

```typescript
// Good
type ChatRoom = ActiveChatRoom | ClosedChatRoom;

// Bad
interface ChatRoom { isActive: boolean; isClosed: boolean; }
```

### `_tag` ディスクリミナントで Union 型を判別する

Discriminated union の判別プロパティには `_tag` を使用し、値は**型名と一致**させる。`status` 等の意味的フラグは使わない。

```typescript
// Good — _tag の値が型名と一致
interface ActiveChatRoom {
  readonly _tag: 'ActiveChatRoom';
}
interface ClosedChatRoom {
  readonly _tag: 'ClosedChatRoom';
  readonly closedAt: Date;
}

// Bad — 文字列リテラルが型名と無関係
interface ActiveChatRoom { status: 'active'; }
interface ClosedChatRoom { status: 'closed'; }
```

`switch (room._tag)` で網羅性チェック（exhaustive check）が効くようにする。

## エラーハンドリング

### `neverthrow` の `Result` 型を使用する

エラーは `throw` ではなく `Result<T, E>` で返す。呼び出し元が明示的にエラーを処理する設計にする。

```typescript
function RoomId(value: string): Result<RoomId, ValidationError> {
  return uuidRegex.test(value)
    ? ok(value as RoomId)
    : err(new ValidationError('RoomIdはUUID v4形式である必要があります'));
}
```

### `_unsafeUnwrap()` はテスト専用

プロダクションコードでは `_unsafeUnwrap()` を使用しない。`match`, `map`, `andThen` などで安全に値を取り出す。

## 関数設計

### 純粋関数を優先する

副作用のない関数を優先する。副作用がある場合はインターフェース層・インフラ層に閉じ込める。

### ファクトリ関数パターン

Entity やデータ構造の生成にはファクトリ関数を使用する。`new` + `class` よりも関数 + `interface` を優先する。

```typescript
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

### ワークフロー関数パターン（サービス層）

サービス層ではクラスを使わず、`Workflow<I, O, E>` 型のファクトリ関数で実装する。依存はクロージャでキャプチャする。**1ファイル = 1ワークフロー関数**。

```typescript
// application/types/workflow.ts
type Workflow<I, O, E> = (input: I) => Promise<Result<O, E>>;

// 型エイリアスで具体型を定義
type EnqueueUser = Workflow<SessionId, void, MatchingError>;

// ファクトリ関数が依存をクロージャにキャプチャ
export function createEnqueueUser(queue: MatchingQueueInterface): EnqueueUser {
  return (sessionId) => queue.enqueue(sessionId);
}
```

### 小さい関数に分割する

1 つの関数は 1 つの責務を持つ。関数が長くなったら分割する。

## 命名規則

| 対象 | 形式 | 例 |
|------|------|-----|
| 変数・関数 | camelCase | `createMessage`, `roomId` |
| 型・インターフェース | PascalCase | `ChatRoom`, `ActiveChatRoom` |
| 定数（設定値） | UPPER_SNAKE_CASE | `MAX_MESSAGE_LENGTH` |
| ファイル名 | camelCase | `valueObjects.ts`, `chatRoom.ts` |
| テストファイル | `<対象>.test.ts` | `valueObjects.test.ts` |

## フォーマット

Biome（`biome.json`）に準拠:

- インデント: 2 スペース
- 行幅: 100 文字
- クォート: シングルクォート
- 末尾カンマ: ES5 準拠
- import は自動整理（`organizeImports: true`）
