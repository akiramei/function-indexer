# チーム機能ガイド

> 🚀 Function Indexerのチーム機能を使って、チーム全体でコード品質を維持しましょう

## 概要

Function Indexer v1.1では、開発チームがプロジェクト全体でコード品質基準を維持するための強力なチーム協働機能を導入しました。これらの機能は既存のGitワークフローやCI/CDパイプラインとシームレスに統合されます。

## 目次

- [Git Diff コマンド](#git-diff-コマンド)
- [レポート生成](#レポート生成)
- [CI/CD 統合](#cicd-統合)
- [ワークフロー例](#ワークフロー例)
- [ベストプラクティス](#ベストプラクティス)

## Git Diff コマンド

ブランチやコミット間の関数を比較して、時間の経過に伴うコード複雑度の変化を理解できます。

### 基本的な使用法

```bash
# 現在のブランチとmainを比較
function-indexer diff main

# 2つのブランチを比較
function-indexer diff main..feature/new-auth

# 特定のコミットを比較
function-indexer diff abc123..def456
```

### オプション

- `-f, --format <format>` - 出力形式: `terminal` (デフォルト), `markdown`, `json`
- `-o, --output <file>` - ファイルに出力を保存
- `--thresholds <json>` - カスタム複雑度しきい値

### 出力例

```
Function Changes: main..feature-auth

Added (3):
  ✅ src/auth/validateToken.ts:15 - validateToken()
  ✅ src/auth/refreshToken.ts:8 - refreshToken()
  ⚠️ src/utils/jwt.ts:22 - decodeJWT()
     Complexity: 12 (しきい値を超過)

Modified (2):
  ⚠️ src/auth/login.ts:45 - authenticateUser() 
     循環的複雑度: 8 → 12 (しきい値を超過)
  ✅ src/auth/logout.ts:12 - logoutUser()

Removed (1):
  ❌ src/auth/legacy.ts:30 - oldAuthMethod()
```

## レポート生成

様々な形式で包括的なコード品質レポートを生成します。

### 基本的な使用法

```bash
# Markdownレポートを生成（デフォルト）
function-indexer report

# HTMLレポートを生成
function-indexer report --format html --output report.html

# カスタムテンプレートを使用
function-indexer report --template ./my-template.hbs
```

### レポート内容

レポートには以下が含まれます：
- **要約統計** - 総関数数、複雑度分布
- **主要な問題** - しきい値を超える関数
- **メトリクス詳細** - ファイル別分析
- **推奨事項** - 実行可能な改善提案

### カスタムテンプレート

レポート用のカスタムHandlebarsテンプレートを作成できます：

```handlebars
# {{title}}

生成日時: {{generatedAt}}

## 概要
- 関数数: {{summary.totalFunctions}}
- 高複雑度: {{summary.highComplexity}}

{{#each violations}}
### {{this.identifier}}
ファイル: {{this.file}}:{{this.startLine}}
問題:
{{#each this.issues}}
- {{this}}
{{/each}}
{{/each}}
```

## CI/CD 統合

`ci`コマンドは継続的インテグレーションパイプライン向けの合理化された体験を提供します。

### 基本的な使用法

```bash
# CI分析を実行
function-indexer ci

# PRコメントを生成
function-indexer ci --comment --base origin/main

# CI系向けのカスタム形式
function-indexer ci --format github  # または gitlab, json
```

### 終了コード

- `0` - すべての品質チェックに合格
- `1` - 品質違反が見つかった（`--fail-on-violation`使用時）

### 環境検出

Function Indexerは以下のCI環境を自動検出します：
- GitHub Actions
- GitLab CI
- CircleCI
- Jenkins
- 汎用CI（`CI`環境変数経由）

## ワークフロー例

### GitHub Actions

```yaml
name: コード品質チェック
on: [pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install -g function-indexer
      - run: function-indexer ci --format github --comment
```

### GitLab CI

```yaml
code-quality:
  stage: test
  script:
    - npm install -g function-indexer
    - function-indexer ci --format gitlab --output code-quality.json
  artifacts:
    reports:
      codequality: code-quality.json
```

### Pre-commitフック

```bash
#!/bin/sh
# .husky/pre-commit

# コミット前にコード品質をチェック
function-indexer ci --fail-on-violation || {
  echo "❌ コード品質チェックに失敗しました！"
  echo "'function-indexer metrics --details'を実行して問題を確認してください"
  exit 1
}
```

### 週次レポート

自動化された週次レポートの設定：

```yaml
# GitHub Actionsの例
name: 週次レポート
on:
  schedule:
    - cron: '0 9 * * 1'  # 毎週月曜日

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          npm install -g function-indexer
          function-indexer
          function-indexer report --output weekly-report.md
      - uses: actions/create-issue@v2
        with:
          title: 週次コード品質レポート
          body-file: weekly-report.md
```

## ベストプラクティス

### 1. チームしきい値の設定

`.function-indexer/config.json`で共有設定を作成：

```json
{
  "metrics": {
    "thresholds": {
      "cyclomaticComplexity": 10,
      "cognitiveComplexity": 15,
      "linesOfCode": 40,
      "nestingDepth": 3,
      "parameterCount": 4
    }
  }
}
```

### 2. 段階的強化

警告から開始し、その後強制：

```bash
# フェーズ1: 警告のみ
function-indexer ci --no-fail-on-violation

# フェーズ2: 基準を強制
function-indexer ci --fail-on-violation
```

### 3. トレンドに焦点

diffを使用して改善を追跡：

```bash
# PRがコード品質を改善するかチェック
function-indexer diff $BASE_BRANCH..$HEAD_BRANCH

# 時間の経過とともにメトリクスを追跡
function-indexer collect-metrics --pr $PR_NUMBER
function-indexer analyze-trends
```

### 4. コードレビューとの統合

PRテンプレートに追加：

```markdown
## コード品質チェックリスト
- [ ] `function-indexer diff main`を実行 - 新しい違反なし
- [ ] 複雑な関数を文書化
- [ ] メトリクスがチームしきい値内
```

### 5. すべてを自動化

- **PR**: 違反の自動コメント
- **メインブランチ**: メトリクス履歴を追跡
- **週次**: レポートを生成して共有
- **Pre-commit**: 問題を早期発見

## トラブルシューティング

### よくある問題

**Q: Diffですべてが「追加」として表示される**
- すべてのブランチを取得していることを確認: `git fetch --all`
- ベースブランチが存在することを確認: `git branch -r`

**Q: CIコマンドがパイプラインで失敗する**
- Node.jsバージョンを確認（16+が必要）
- CI環境でGitが利用可能であることを確認
- diffのためにフルクローン（shallow以外）を確実に実行

**Q: レポートが空**
- 最初に`function-indexer`を実行してインデックスを生成
- `.function-indexer/index.jsonl`が存在することを確認
- 設定のファイルパターンを確認

### ヘルプの取得

- [トラブルシューティングガイド](TROUBLESHOOTING.md)を確認
- [GitHub](https://github.com/akiramei/function-indexer/issues)でissueを開く
- 動作する設定については[examples/](../examples/)を参照