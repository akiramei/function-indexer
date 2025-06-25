# 📚 Function Indexer - コマンドリファレンス

**クイックアクセスコマンドガイド** | バージョン 1.1.0

## 🚀 クイックコマンド検索

| タスク | コマンド | 例 |
|-------|---------|-----|
| **初回セットアップ** | `npx @akiramei/function-indexer` | `npx @akiramei/function-indexer` |
| **特定ディレクトリをインデックス** | `function-indexer -r <path>` | `function-indexer -r ./src` |
| **関数検索** | `function-indexer search <query>` | `function-indexer search "認証"` |
| **品質メトリクス表示** | `function-indexer metrics` | `function-indexer metrics --details` |
| **ブランチ比較** | `function-indexer diff <base> <target>` | `function-indexer diff main HEAD` |
| **レポート生成** | `function-indexer report` | `function-indexer report --format html` |
| **CI/CDチェック** | `function-indexer ci` | `function-indexer ci --format github` |
| **メトリクス収集** | `function-indexer collect-metrics` | `function-indexer collect-metrics --pr 123` |

## 📋 完全コマンドリファレンス

### コアコマンド

#### `function-indexer` - メインインデックスコマンド
コードベースの関数インデックスを生成または更新します。

```bash
function-indexer [options]
```

**オプション:**
- `-r, --root <path>` - スキャンするルートディレクトリ（省略時は自動検出）
- `-o, --output <file>` - 出力ファイルパス（省略時は自動生成）
- `-v, --verbose` - 詳細な進捗を表示

**例:**
```bash
# 初回セットアップ（ゼロ設定）
npx @akiramei/function-indexer

# 特定ディレクトリをインデックス
function-indexer --root ./src --output functions.jsonl

# 詳細出力
function-indexer --verbose
```

---

### 検索・分析コマンド

#### `search` - 自然言語関数検索
自然言語やパターンを使用して関数を検索します。

```bash
function-indexer search <query> [options]
```

**オプション:**
- `-c, --context <context>` - 検索の追加コンテキスト
- `-l, --limit <number>` - 最大結果数（デフォルト: 10）
- `--no-save-history` - 検索履歴に保存しない

**例:**
```bash
# シンプルな検索
function-indexer search "認証"

# コンテキスト付き検索
function-indexer search "検証" --context "ユーザー入力"

# 結果数制限
function-indexer search "ハンドラー" --limit 20
```

---

#### `metrics` - コード品質概要
コード品質メトリクスと違反を表示します。

```bash
function-indexer metrics [options]
```

**オプション:**
- `-d, --details` - 閾値を超えるすべての関数を表示

**例:**
```bash
# クイック概要
function-indexer metrics

# 詳細な違反表示
function-indexer metrics --details
```

---

### 比較・レポートコマンド

#### `diff` - ブランチ間の関数比較
Gitブランチまたはコミット間の関数変更を比較します。

```bash
function-indexer diff [base] [target] [options]
```

**引数:**
- `base` - ベースブランチ/コミット（デフォルト: main）
- `target` - ターゲットブランチ/コミット（デフォルト: HEAD）

**オプション:**
- `-r, --root <path>` - プロジェクトルートディレクトリ
- `-o, --output <file>` - 出力をファイルに保存
- `-f, --format <format>` - 出力形式: terminal, markdown, json
- `--thresholds <json>` - カスタム複雑度閾値

**例:**
```bash
# 現在のブランチとmainを比較
function-indexer diff

# 特定ブランチを比較
function-indexer diff develop feature/new-auth

# Markdownとして保存
function-indexer diff main HEAD --format markdown --output changes.md

# カスタム閾値
function-indexer diff --thresholds '{"cyclomaticComplexity":8}'
```

---

#### `report` - 品質レポート生成
包括的なコード品質レポートを作成します。

```bash
function-indexer report [options]
```

**オプション:**
- `-o, --output <file>` - 出力ファイル（デフォルト: 標準出力）
- `-f, --format <format>` - 形式: markdown, html, json
- `-t, --template <path>` - カスタムHandlebarsテンプレート
- `--thresholds <json>` - カスタム閾値

**例:**
```bash
# ターミナル出力
function-indexer report

# HTMLダッシュボード
function-indexer report --format html --output dashboard.html

# 処理用JSON
function-indexer report --format json --output metrics.json
```

---

### CI/CD統合コマンド

#### `ci` - 継続的インテグレーション分析
CI/CDパイプライン用の品質チェックを実行します。

```bash
function-indexer ci [options]
```

**オプション:**
- `-r, --root <path>` - プロジェクトルート
- `-b, --base <branch>` - 比較用ベースブランチ
- `-o, --output <file>` - 結果出力ファイル
- `-f, --format <format>` - 形式: terminal, github, gitlab, json
- `--thresholds <json>` - カスタム閾値
- `--fail-on-violation` - 違反時にエラーで終了
- `--comment` - PR/MRコメント生成
- `-v, --verbose` - 詳細出力

**例:**
```bash
# GitHub Actions
function-indexer ci --format github --fail-on-violation

# コメント付きGitLab CI
function-indexer ci --format gitlab --comment

# カスタム閾値
function-indexer ci --thresholds '{"cyclomaticComplexity":10}'
```

---

### メトリクス追跡コマンド

#### `collect-metrics` - 履歴メトリクス収集
トレンド分析用に関数メトリクスを保存します。

```bash
function-indexer collect-metrics [options]
```

**オプション:**
- `-r, --root <path>` - ルートディレクトリ（デフォルト: ./src）
- `--metrics-output <file>` - JSONLファイルへエクスポート
- `--pr <number>` - PR番号と関連付け
- `--commit <hash>` - 特定のコミット（デフォルト: HEAD）
- `--branch <name>` - ブランチ名（デフォルト: 現在）
- `--verbose-metrics` - 詳細出力

**例:**
```bash
# 基本的な収集
function-indexer collect-metrics

# PR追跡
function-indexer collect-metrics --pr 123

# ファイルへエクスポート
function-indexer collect-metrics --metrics-output metrics.jsonl
```

---

#### `show-metrics` - 関数履歴表示
特定関数のメトリクス履歴を表示します。

```bash
function-indexer show-metrics [functionId] [options]
```

**引数:**
- `functionId` - 関数パス（形式: "file:functionName"）

**オプション:**
- `-l, --limit <number>` - 履歴エントリ制限（デフォルト: 10）
- `--list` - メトリクス付きの全関数をリスト

**例:**
```bash
# 利用可能な関数をリスト
function-indexer show-metrics --list

# 特定関数を表示
function-indexer show-metrics "src/auth.ts:validateUser"

# 履歴を制限
function-indexer show-metrics "src/api.ts:handleRequest" --limit 5
```

---

#### `analyze-trends` - 品質トレンド分析
メトリクストレンドを分析し、リスク領域を特定します。

```bash
function-indexer analyze-trends
```

**例:**
```bash
function-indexer analyze-trends
```

---

#### `pr-metrics` - PR固有メトリクス
特定のプルリクエストのすべてのメトリクスを表示します。

```bash
function-indexer pr-metrics <prNumber>
```

**例:**
```bash
function-indexer pr-metrics 123
```

---

### メンテナンスコマンド

#### `update` - 既存インデックス更新
関数インデックスを最新の変更で更新します。

```bash
function-indexer update <index> [options]
```

**オプション:**
- `--auto-backup` - 更新前にバックアップ作成（デフォルト: true）
- `--no-backup` - バックアップをスキップ
- `-v, --verbose` - 詳細出力

**例:**
```bash
# バックアップ付き更新
function-indexer update function-index.jsonl

# バックアップスキップ
function-indexer update function-index.jsonl --no-backup
```

---

#### `validate` - インデックス整合性検証
関数インデックスが有効で破損していないかチェックします。

```bash
function-indexer validate <index>
```

**例:**
```bash
function-indexer validate function-index.jsonl
```

---

#### `backup` - インデックスバックアップ作成
関数インデックスのバックアップを作成します。

```bash
function-indexer backup <index>
```

**例:**
```bash
function-indexer backup function-index.jsonl
```

---

#### `restore` - バックアップから復元
バックアップから関数インデックスを復元します。

```bash
function-indexer restore <backupId>
```

**例:**
```bash
function-indexer restore backup-20240115-123456
```

---

### ユーティリティコマンド

#### `show-history` - 検索履歴表示
過去の検索クエリと結果を表示します。

```bash
function-indexer show-history [options]
```

**オプション:**
- `-q, --query <query>` - クエリでフィルタ

**例:**
```bash
# 全履歴
function-indexer show-history

# クエリでフィルタ
function-indexer show-history --query "認証"
```

---

#### `generate-descriptions` - AI説明生成
関数のAI生成説明を作成します（OpenAI APIキーが必要）。

```bash
function-indexer generate-descriptions [options]
```

**オプション:**
- `-i, --index <file>` - 入力インデックスファイル
- `-o, --output <file>` - 出力ファイル
- `-b, --batch-size <number>` - 処理バッチサイズ

**例:**
```bash
# 環境変数にOPENAI_API_KEYが必要
function-indexer generate-descriptions -i functions.jsonl -o enhanced.jsonl
```

---

## 💡 一般的な使用パターン

### 初期プロジェクトセットアップ
```bash
# 1. 初期化とスキャン
npx @akiramei/function-indexer

# 2. 品質概要を表示
function-indexer metrics

# 3. 特定の関数を検索
function-indexer search "メインエントリポイント"
```

### 日常開発ワークフロー
```bash
# 最新の変更でインデックス更新
function-indexer

# コミット前の品質チェック
function-indexer metrics --details

# mainブランチと比較
function-indexer diff
```

### コードレビュープロセス
```bash
# PR変更を比較
function-indexer diff main feature-branch

# 詳細レポート生成
function-indexer report --format markdown --output pr-analysis.md

# 特定関数をチェック
function-indexer search "変更された関数" --context "認証"
```

### CI/CDパイプライン
```bash
# GitHub Actionsで
- run: |
    npx @akiramei/function-indexer collect-metrics --pr ${{ github.event.number }}
    npx @akiramei/function-indexer ci --format github --fail-on-violation

# GitLab CIで
- script: |
    npx @akiramei/function-indexer ci --format gitlab --comment
```

### 品質追跡
```bash
# 現在の状態のメトリクス収集
function-indexer collect-metrics

# トレンド表示
function-indexer analyze-trends

# 特定関数を追跡
function-indexer show-metrics "src/core.ts:processData"
```

## 🔧 設定

Function Indexerは`.function-indexer/`ディレクトリの設定ファイルを使用します：

### コア設定 (config.json)
```json
{
  "version": "1.1.0",
  "root": "./src",
  "output": "function-index.jsonl",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

### メトリクス設定 (metrics-config.json)
```json
{
  "thresholds": {
    "cyclomaticComplexity": 10,
    "cognitiveComplexity": 15,
    "linesOfCode": 50,
    "nestingDepth": 4,
    "parameterCount": 4
  }
}
```

## 📝 注意事項

- ほとんどのコマンドは最初に初期化が必要（引数なしで`function-indexer`）
- 問題のデバッグには`--verbose`フラグを使用
- 関数ID形式: `"path/to/file.ts:functionName"` または `"path/to/file.ts:ClassName.methodName"`
- すべてのパスはプロジェクトルートからの相対パス
- JSONL形式: 1行に1つのJSONオブジェクト

---

*AI統合パターンと高度な使用法については、[AI マスターガイド](./AI-MASTER-GUIDE-ja.md)を参照してください*