---
description: TDD（テスト駆動開発）サイクルで機能を実装する
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
argument-hint: <対象コンポーネントまたは機能の説明>
---

# TDD 実装スキル

## ワークフロー

### Step 1: 対象把握

- `$ARGUMENTS` から実装対象を把握する
- 関連する既存コード・テストを確認する
- テストファイルの配置先を決定する（co-located `.test.ts`）

### Step 2: RED - 失敗するテストを書く

1. テストファイルを作成する（存在しない場合）
2. テスト対象の振る舞いをテストとして記述する
   - テスト説明は **日本語**
   - `describe` / `it` を使用
3. `pnpm test` を実行し、テストが **失敗する** ことを確認する

```typescript
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import MyComponent from './MyComponent.svelte';

describe('MyComponent', () => {
  it('期待する振る舞いの説明', () => {
    render(MyComponent, { props: { /* ... */ } });
    // Assert
  });
});
```

### Step 3: GREEN - テストを通す最小限のコードを書く

1. テストを通すための **最小限** の実装を行う
2. コンポーネントは Svelte v5 Runes API で実装する
3. `pnpm test` を実行し、テストが **成功する** ことを確認する

### Step 4: REFACTOR - コードを整理する

1. 重複の除去、命名の改善
2. コンポーネント分割、Store の抽出
3. `pnpm test` を実行し、テストが **引き続き成功する** ことを確認する

### 繰り返し

Step 2〜4 を対象機能が完成するまで繰り返す。各サイクルで必ず `pnpm test` を実行する。
