---
description: TDD（テスト駆動開発）サイクルで機能を実装する
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
argument-hint: <対象 Widget またはモジュールの説明>
---

# TDD 実装スキル

## ワークフロー

### Step 1: 対象把握

- `$ARGUMENTS` から実装対象を把握する
- 関連する既存コード・テストを確認する
- テストファイルの配置先を決定する（`test/` 配下にソースと同じ構造）

### Step 2: RED - 失敗するテストを書く

1. テストファイルを作成する（存在しない場合）
2. テスト対象の振る舞いをテストとして記述する
   - テスト説明は **日本語**
   - `group` / `test` / `testWidgets` を使用
3. `flutter test` を実行し、テストが **失敗する** ことを確認する

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('対象モジュール', () {
    test('期待する振る舞いの説明', () {
      // Arrange → Act → Assert
    });

    testWidgets('Widget の振る舞いの説明', (tester) async {
      // Arrange → Act → Assert
    });
  });
}
```

### Step 3: GREEN - テストを通す最小限のコードを書く

1. テストを通すための **最小限** の実装を行う
2. Riverpod Provider パターンに従う
3. `flutter test` を実行し、テストが **成功する** ことを確認する

### Step 4: REFACTOR - コードを整理する

1. 重複の除去、命名の改善
2. Widget 分割、Provider の抽出
3. `flutter test` を実行し、テストが **引き続き成功する** ことを確認する

### 繰り返し

Step 2〜4 を対象機能が完成するまで繰り返す。各サイクルで必ず `flutter test` を実行する。
