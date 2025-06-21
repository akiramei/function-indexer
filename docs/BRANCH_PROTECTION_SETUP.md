# ブランチ保護ルール設定ガイド

## 個人プロジェクト向け推奨設定

### 設定手順

1. **GitHubリポジトリにアクセス**
   - https://github.com/akiramei/function-indexer
   - **Settings** タブをクリック

2. **ブランチ保護の設定**
   - 左サイドバーの **Branches** をクリック
   - **Add rule** ボタンをクリック

3. **ルール設定**

#### Branch name pattern
```
main
```

#### Protection Rules (推奨設定)

✅ **Require a pull request before merging**
- ✅ Require approvals: `0` (自分で承認可能)
- ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ Require review from code owners (将来のため)

✅ **Require status checks to pass before merging**
- ✅ Require branches to be up to date before merging
- 📝 Required status checks: (GitHub Actions設定後に追加)
  - `CI / test` (テスト実行)
  - `CI / build` (ビルド確認)

✅ **Require conversation resolution before merging**
- コメントでの指摘事項を解決してからマージ

✅ **Require signed commits** (オプション - セキュリティ重視なら有効)

✅ **Require linear history**
- マージコミットを防ぎ、履歴を綺麗に保つ

❌ **Restrict pushes that create files** (個人開発では不要)

✅ **Allow force pushes** (個人開発では柔軟性のため有効)
- ✅ Everyone (個人開発のため)

✅ **Allow deletions** (ブランチ削除を許可)

⚠️ **重要**: 最後に以下を必ず設定
✅ **Do not allow bypassing the above settings**
❌ **Allow administrators to bypass these restrictions** (チェックを外す)

### 個人開発での運用フロー

1. **新機能開発**
   ```bash
   git checkout -b feature/new-feature
   # 開発作業
   git push origin feature/new-feature
   ```

2. **Pull Request作成**
   - GitHubでPR作成
   - 自分でレビュー・承認
   - マージ

3. **緊急修正時**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/urgent-fix
   # 修正作業
   # 通常のPRフローに従う
   ```

### GitHub Actions CI/CD設定

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    name: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run build

  lint:
    name: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
```

### 設定の効果

#### ✅ メリット
- **品質保証**: テスト・ビルドの成功を確認してからマージ
- **変更履歴**: すべての変更がPRとして記録
- **レビュー習慣**: 自分のコードを客観視する機会
- **将来対応**: チーム開発時の準備

#### ⚠️ 注意事項
- PR作成の手間が増加（品質向上とのトレードオフ)
- CI/CDがない場合は一部設定を後回し可能

### トラブルシューティング

#### 自分でマージできない場合
1. Settings > Branches で設定確認
2. "Allow administrators to bypass" が有効か確認
3. あなたが管理者権限を持っているか確認

#### CI/CDエラーでマージできない場合
1. テスト・ビルドエラーを修正
2. 緊急時は管理者権限でバイパス
3. 設定を一時的に無効化

## 段階的導入

### Phase 1 (今すぐ): 基本設定
- PR必須
- 管理者バイパス有効

### Phase 2 (CI/CD設定後): 自動チェック
- ステータスチェック必須
- テスト・ビルド成功必須

### Phase 3 (チーム参加時): 厳格化
- 承認者数増加
- 管理者バイパス無効
- より厳しいルール追加