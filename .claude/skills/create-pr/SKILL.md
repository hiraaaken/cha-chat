---
description: GitHub Pull Request を作成する
allowed-tools: Bash, Read, Grep, Glob
argument-hint: [draft]
---

# Pull Request 作成スキル

## 手順

1. **コンテキスト収集**
   - `git log main..HEAD --oneline` で対象コミットを確認
   - `git diff main...HEAD --stat` で変更ファイルを確認
   - 現在のブランチ名から Issue 番号を抽出（`feature_<N>` → `#<N>`）

2. **PR 作成**

   以下のテンプレートで PR を作成する。

   ```
   gh pr create \
     --title "[#<Issue番号>] <変更内容>" \
     --body "$(cat <<'EOF'
   ## 概要
   <この PR で何を実現するか 1-2 文>

   ## 変更内容
   - <変更点 1>
   - <変更点 2>
   - ...

   ## テスト
   - [ ] <テスト項目 1>
   - [ ] <テスト項目 2>

   ## 関連 Issue
   Closes #<Issue番号>

   ## Insight
   <実装中に得た知見や判断理由を記述（必須）>
   EOF
   )"
   ```

3. **ドラフト対応**
   - `$ARGUMENTS` が `draft` の場合、`gh pr create` に `--draft` フラグを付与する

4. **完了報告**
   - 作成した PR の URL を表示する
