# 🤖 Function Indexer - AIアシスタント向けガイド

## 概要
Function Indexerは、TypeScript/TSXコードベースをスキャンし、すべての関数・メソッド・アロー関数を構造化されたJSONL形式で抽出し、コード品質メトリクスを計算するCLIツールです。

### AIアシスタント向け
「Function Indexerを使ってコード品質を管理する」よう依頼された場合は、以下の手順に従ってください：
1. 前提条件（Linux）をインストールしてFunction Indexerを準備
2. 初回スキャンを実行してベースラインを確立
3. 追跡用のメトリクス収集を設定
4. 自動チェック用のCI/CD統合を構成
5. コードレビュー用の定期レポートを作成

## 主要機能
- **関数検出**: TypeScript/TSXファイル内のすべての関数を検出
- **メトリクス分析**: 複雑度、コード行数、ネスト深度を計算
- **検索機能**: 自然言語およびパターンベースの関数検索
- **変更追跡**: コンテンツハッシュによる変更検出
- **品質監視**: コード品質の経時的追跡

## インストールと基本使用法

```bash
# 前提条件（Linux/WSL）
sudo apt-get update
sudo apt-get install build-essential python3-dev

# カレントディレクトリをスキャン
npx github:akiramei/function-indexer

# 特定ディレクトリをスキャンして出力
npx github:akiramei/function-indexer --root ./src --output functions.jsonl

# PRのメトリクスを収集
npx github:akiramei/function-indexer collect-metrics --root ./src --pr 123
```

## コマンドリファレンス

### 1. メインコマンド - 関数インデックス生成
```bash
npx github:akiramei/function-indexer --root <path> --output <file> [options]
```
**目的**: コードベースをスキャンし、すべての関数をJSONLファイルに出力
**オプション**:
- `--root, -r`: スキャンディレクトリ（デフォルト: 自動検出）
- `--output, -o`: 出力ファイル（デフォルト: .function-indexer/ 内に自動生成）
- `--verbose, -v`: 詳細な進捗表示

**注意**: Function Indexerは設定不要で動作します - `npx github:akiramei/function-indexer` を実行するだけで開始できます！

**出力形式**（JSONL、1行1オブジェクト）:
```json
{
  "file": "src/services/auth.ts",
  "identifier": "validateToken",
  "signature": "async function validateToken(token: string): Promise<boolean>",
  "startLine": 15,
  "endLine": 28,
  "hash_function": "a3f5c912",
  "hash_file": "b8d4e7f1",
  "exported": true,
  "async": true,
  "metrics": {
    "linesOfCode": 12,
    "cyclomaticComplexity": 4,
    "cognitiveComplexity": 6,
    "nestingDepth": 2,
    "parameterCount": 1,
    "hasReturnType": true
  },
  "domain": "backend"
}
```

### 2. `search` - 関数検索
```bash
npx github:akiramei/function-indexer search <query> [options]
```
**目的**: 名前、内容、自然言語で関数を検索
**オプション**:
- `--context, -c`: 検索のコンテキストを提供
- `--limit, -l`: 最大結果数（デフォルト: 10）
- `--no-save-history`: 検索履歴を保存しない

**使用例**:
```bash
# 名前で検索
npx github:akiramei/function-indexer search "validate"

# コンテキスト付き自然言語検索
npx github:akiramei/function-indexer search "認証" --context "ログインとセキュリティ"

# 結果数制限
npx github:akiramei/function-indexer search "コンポーネント" --limit 5
```

### 3. `metrics` - コード品質分析
```bash
npx github:akiramei/function-indexer metrics [options]
```
**目的**: コード品質メトリクスと違反を表示
**オプション**:
- `--details, -d`: 関数レベルの詳細メトリクスを表示

**出力例**:
```
📊 コード品質レポート
━━━━━━━━━━━━━━━━━━━
総関数数: 142
平均複雑度: 4.3
閾値超過関数: 8

⚠️  高複雑度関数:
1. processOrder (src/orders.ts:45) - 複雑度: 18
2. calculateShipping (src/shipping.ts:122) - 複雑度: 15
```

### 4. `collect-metrics` - 品質の経時追跡
```bash
npx github:akiramei/function-indexer collect-metrics --root <path> [options]
```
**目的**: SQLiteデータベースにメトリクスを保存しトレンド分析
**オプション**:
- `--pr`: PR番号と関連付け
- `--branch`: Gitブランチ名
- `--commit`: 特定のコミットハッシュ

### 5. `show-metrics` - 関数履歴表示
```bash
npx github:akiramei/function-indexer show-metrics <function-path>
```
**目的**: 特定関数のメトリクス履歴を表示
**形式**: "file:functionName" または "file:className.methodName"
**オプション**:
- `--limit, -l`: 履歴エントリ数の制限（デフォルト: 10）

**例**:
```bash
npx github:akiramei/function-indexer show-metrics "src/auth.ts:validateToken"
```

### 6. `diff` - ブランチ間の関数比較
```bash
npx github:akiramei/function-indexer diff [base] [target]
```
**目的**: Gitブランチまたはコミット間で関数を比較
**引数**:
- `base`: ベースブランチまたはコミット（デフォルト: main）
- `target`: ターゲットブランチまたはコミット（デフォルト: HEAD）
**オプション**:
- `--root, -r`: プロジェクトルートディレクトリ
- `--output, -o`: 出力ファイルパス
- `--format, -f`: 出力形式（terminal, markdown, json）

### 7. `report` - 包括的レポート生成
```bash
npx github:akiramei/function-indexer report [options]
```
**目的**: 詳細なコード品質レポートを生成

### 8. `ci` - CI/CDパイプライン統合
```bash
npx github:akiramei/function-indexer ci [options]
```
**目的**: CI/CDパイプラインに最適化された分析を実行
**オプション**:
- `--format`: 出力形式（github, jsonなど）

### 9. その他のコマンド
- `analyze-trends`: メトリクストレンドと違反の分析
- `pr-metrics <prNumber>`: 特定PRのメトリクス表示
- `update <index>`: 既存の関数インデックスを更新
- `validate <index>`: インデックスの整合性検証
- `backup <index>`: インデックスのバックアップ作成
- `restore <backupId>`: バックアップから復元

## AIタスクテンプレート

### タスク1: リファクタリング対象の複雑な関数を検索
```
function-indexerを使用して、src/ディレクトリ内の循環的複雑度が10を超えるすべての関数を見つけ、リファクタリングの優先順位を提案してください。

実行コマンド:
1. npx github:akiramei/function-indexer --root ./src
2. npx github:akiramei/function-indexer metrics --details
```

### タスク2: PR前のコード品質分析
```
PR #123をマージする前に、コード品質への影響を分析してください：

実行コマンド:
1. npx github:akiramei/function-indexer collect-metrics --root ./src --pr 123
2. npx github:akiramei/function-indexer pr-metrics 123
3. npx github:akiramei/function-indexer analyze-trends
3. npx github:akiramei/function-indexer analyze-trends --days 30
```

### タスク3: 類似関数の検索
```
データベース操作を処理する関数を見つけてください：

実行コマンド:
1. npx github:akiramei/function-indexer --root ./src
2. npx github:akiramei/function-indexer search "database" --context "非同期操作"
```

### タスク4: 関数の成長監視
```
特定の関数が時間とともにどのように成長したかを追跡してください：

実行コマンド:
1. npx github:akiramei/function-indexer show-metrics "src/core/processor.ts:processData" --limit 10
```

## 統合パターン

### CI/CDパイプライン統合
```yaml
# GitHub Actions例
- name: コード品質分析
  run: |
    sudo apt-get update && sudo apt-get install -y build-essential python3-dev
    npx github:akiramei/function-indexer collect-metrics --root ./src --pr ${{ github.event.number }}
    npx github:akiramei/function-indexer ci --format github
```

### Pre-commitフック
```bash
#!/bin/bash
# .git/hooks/pre-commit
npx github:akiramei/function-indexer metrics --threshold --root ./src
if [ $? -ne 0 ]; then
  echo "❌ コード品質チェック失敗。高複雑度の関数を修正してください。"
  exit 1
fi
```

### VS Codeタスク
```json
{
  "label": "複雑な関数を検索",
  "type": "shell",
  "command": "npx github:akiramei/function-indexer search '*' --metrics.complexity '>10'",
  "problemMatcher": []
}
```

## メトリクス閾値

| メトリクス | 良好 | 警告 | 不良 |
|-----------|------|------|------|
| 循環的複雑度 | < 5 | 5-10 | > 10 |
| 認知的複雑度 | < 8 | 8-15 | > 15 |
| コード行数 | < 20 | 20-40 | > 40 |
| ネスト深度 | ≤ 2 | 3 | > 3 |
| パラメータ数 | ≤ 3 | 4 | > 4 |

## 一般的なAIワークフロー

### 1. コードベース理解
```bash
# 概要取得
npx github:akiramei/function-indexer metrics --root ./src

# エントリポイント検索
npx github:akiramei/function-indexer search "main" --exported true

# 複雑な領域検索
npx github:akiramei/function-indexer search "*" --metrics.complexity ">10"
```

### 2. コードレビュー支援
```bash
# 変更ファイルをインデックス
npx github:akiramei/function-indexer index --root ./src --include "**/changed/*.ts"

# 品質チェック
npx github:akiramei/function-indexer metrics --threshold
```

### 3. リファクタリング計画
```bash
# 候補検索
npx github:akiramei/function-indexer search "*" --metrics.loc ">50"

# 重複検索
npx github:akiramei/function-indexer search "類似した関数名やパターン"
```

## 出力処理のヒント

1. **JSONL解析**: 各行が完全なJSONオブジェクト
2. **メトリクスでフィルタ**: jqなどのツールを使用
3. **変更追跡**: hash_function値を比較
4. **ファイル別グループ化**: モジュール単位でメトリクスを集計

## クイック判断ガイド

- **関数を見つけたい？** → `search`コマンド使用
- **品質の概要が欲しい？** → `metrics`コマンド使用
- **自動化を構築？** → `index`コマンド + JSONL解析
- **トレンド追跡？** → `collect-metrics` + `analyze-trends`使用
- **コードレビュー？** → `metrics --threshold`使用

## エラー処理

- **関数が見つからない**: --includeパターンを確認
- **解析エラー**: ファイルに構文エラーがある可能性
- **大規模コードベース**: --excludeで不要ファイルをスキップ
- **メモリ問題**: ディレクトリを分割して処理

## AI使用のベストプラクティス

1. 常に最初にメインコマンドを実行して最新データを作成
2. 特定の`--root`パスを使用してスコープを制限
3. 複数のメトリクスを組み合わせてより良い洞察を得る
4. 高度な処理のためにJSONL出力を保存
5. デバッグ時は`--verbose`を使用

## 新規プロジェクトのクイックセットアップ

新しいプロジェクトのコード品質管理を設定する場合：

```bash
# 1. 前提条件と初期化
sudo apt-get update && sudo apt-get install -y build-essential python3-dev
cd your-project
npx github:akiramei/function-indexer

# 2. 現在の品質状態を確認
npx github:akiramei/function-indexer metrics --details

# 3. 継続的な監視を設定
npx github:akiramei/function-indexer collect-metrics --pr $PR_NUMBER

# 4. package.jsonスクリプトに追加
npm pkg set scripts.quality="npx github:akiramei/function-indexer metrics"
npm pkg set scripts.quality:detailed="npx github:akiramei/function-indexer metrics --details"

# 5. GitHub Actionを作成（.github/workflows/code-quality.ymlとして保存）
echo 'name: Code Quality Check
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: sudo apt-get update && sudo apt-get install -y build-essential python3-dev
      - run: npx github:akiramei/function-indexer ci --format github' > .github/workflows/code-quality.yml
```