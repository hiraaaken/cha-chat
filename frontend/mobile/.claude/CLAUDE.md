# Frontend Mobile - cha-chat

## 技術スタック

| 技術 | 用途 |
|------|------|
| Flutter v3.38.6 | UI フレームワーク |
| Dart | 開発言語 |
| Riverpod | 状態管理・DI |
| socket_io_client | WebSocket 通信 |
| flutter_test | テストフレームワーク |

## コーディング規約

`analysis_options.yaml` に準拠する:

- Dart 公式 lint ルール（`flutter_lints` ベース）に従う
- `dynamic` 型の使用は最小限にする
- `const` コンストラクタを積極的に使用する
- 末尾カンマを付与する（フォーマッターによる整形のため）

## アーキテクチャ

### ディレクトリ構成

```
lib/
├── presentation/     # UI 層（Widget、Screen）
│   ├── screens/      # 画面単位の Widget
│   ├── widgets/      # 再利用可能な UI 部品
│   └── theme/        # テーマ定義
├── application/      # アプリケーション層（Riverpod Provider）
├── domain/           # ドメイン層（モデル、リポジトリインターフェース）
│   ├── models/       # データモデル
│   └── repositories/ # リポジトリインターフェース
└── infrastructure/   # インフラ層（API 通信、Socket.IO 接続）
    ├── repositories/  # リポジトリ実装
    └── services/      # 外部サービス接続
```

### 依存方向

- presentation → application → domain ← infrastructure
- domain 層は他のどの層にも依存しない
- infrastructure 層は domain 層のインターフェースを実装する

### 状態管理（Riverpod）

- `Provider`: 読み取り専用の値
- `StateNotifierProvider`: 変更可能な状態
- `FutureProvider` / `StreamProvider`: 非同期データ
- `ref.watch` でリアクティブに状態を購読する

### Widget 分割方針

- 画面単位の `Screen` Widget と再利用可能な `Widget` を分離する
- `StatelessWidget` を優先し、`ConsumerWidget`（Riverpod）で状態を購読する
- Widget の深いネストを避け、適切に分割する

## テスト規約

- フレームワーク: **flutter_test**
- ファイル配置: `test/` ディレクトリにソースと同じ構造で配置
- テスト説明: **日本語**で記述
- 実行: `flutter test`

```dart
void main() {
  group('ChatMessage', () {
    testWidgets('メッセージテキストを表示する', (tester) async {
      await tester.pumpWidget(/* ... */);
      expect(find.text('こんにちは'), findsOneWidget);
    });
  });
}
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
