# 🤖 Function Indexer - AIアシスタント向けガイド

## 概要
Function Indexerは、TypeScript/TSXコードベースをスキャンし、すべての関数・メソッド・アロー関数を構造化されたJSONL形式で抽出し、コード品質メトリクスを計算するCLIツールです。

## 主要機能
- **関数検出**: TypeScript/TSXファイル内のすべての関数を検出
- **メトリクス分析**: 複雑度、コード行数、ネスト深度を計算
- **検索機能**: 自然言語およびパターンベースの関数検索
- **変更追跡**: コンテンツハッシュによる変更検出
- **品質監視**: コード品質の経時的追跡

## インストールと基本使用法

```bash
# グローバルインストール
npm install -g github:akiramei/function-indexer

# カレントディレクトリをスキャン
function-indexer

# 特定ディレクトリをスキャンして出力
function-indexer index --root ./src --output functions.jsonl

# PRのメトリクスを収集
function-indexer collect-metrics --root ./src --pr 123
```

## コマンドリファレンス

### 1. `index` - 関数インデックス生成
```bash
function-indexer index --root <path> --output <file> [options]
```
**目的**: コードベースをスキャンし、すべての関数をJSONLファイルに出力
**オプション**:
- `--root`: スキャンディレクトリ（デフォルト: カレント）
- `--output`: 出力ファイル（デフォルト: function-index.jsonl）
- `--include`: 含めるファイルパターン（デフォルト: **/*.ts,**/*.tsx）
- `--exclude`: 除外パターン（デフォルト: node_modules,テストファイル）
- `--domain`: カテゴリ分類用のカスタムドメインタグ
- `--verbose`: 詳細な進捗表示

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
function-indexer search <query> [options]
```
**目的**: 名前、内容、自然言語で関数を検索
**オプション**:
- `--root`: 検索ディレクトリ
- `--limit`: 最大結果数（デフォルト: 10）
- `--metrics`: メトリクスでフィルタ（例: --metrics.complexity ">10"）

**使用例**:
```bash
# 名前で検索
function-indexer search "validate"

# 複雑な関数を検索
function-indexer search "*" --metrics.complexity ">15"

# 自然言語検索
function-indexer search "認証を処理する関数"
```

### 3. `metrics` - コード品質分析
```bash
function-indexer metrics [options]
```
**目的**: コード品質メトリクスと違反を表示
**オプション**:
- `--root`: 分析ディレクトリ
- `--threshold`: 違反のみ表示
- `--sort`: メトリクスでソート（complexity, loc, nesting）

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
function-indexer collect-metrics --root <path> [options]
```
**目的**: SQLiteデータベースにメトリクスを保存しトレンド分析
**オプション**:
- `--pr`: PR番号と関連付け
- `--branch`: Gitブランチ名
- `--commit`: 特定のコミットハッシュ

### 5. `show-metrics` - 関数履歴表示
```bash
function-indexer show-metrics <function-path>
```
**目的**: 特定関数のメトリクス履歴を表示
**形式**: "file:functionName" または "file:className.methodName"

**例**:
```bash
function-indexer show-metrics "src/auth.ts:validateToken"
```

## AIタスクテンプレート

### タスク1: リファクタリング対象の複雑な関数を検索
```
function-indexerを使用して、src/ディレクトリ内の循環的複雑度が10を超えるすべての関数を見つけ、リファクタリングの優先順位を提案してください。

実行コマンド:
1. function-indexer index --root ./src
2. function-indexer search "*" --metrics.complexity ">10" --limit 20
```

### タスク2: PR前のコード品質分析
```
PR #123をマージする前に、コード品質への影響を分析してください：

実行コマンド:
1. function-indexer collect-metrics --root ./src --pr 123
2. function-indexer pr-metrics 123
3. function-indexer analyze-trends --days 30
```

### タスク3: 類似関数の検索
```
データベース操作を処理するすべての非同期関数を見つけてください：

実行コマンド:
1. function-indexer index --root ./src
2. function-indexer search "database" --metrics.async "true"
```

### タスク4: 関数の成長監視
```
特定の関数が時間とともにどのように成長したかを追跡してください：

実行コマンド:
1. function-indexer show-metrics "src/core/processor.ts:processData" --limit 10
```

## 統合パターン

### CI/CDパイプライン統合
```yaml
# GitHub Actions例
- name: コード品質分析
  run: |
    npm install -g github:akiramei/function-indexer
    function-indexer collect-metrics --root ./src --pr ${{ github.event.number }}
    function-indexer metrics --threshold --format markdown >> $GITHUB_STEP_SUMMARY
```

### Pre-commitフック
```bash
#!/bin/bash
# .git/hooks/pre-commit
function-indexer metrics --threshold --root ./src
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
  "command": "function-indexer search '*' --metrics.complexity '>10'",
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
function-indexer metrics --root ./src

# エントリポイント検索
function-indexer search "main" --exported true

# 複雑な領域検索
function-indexer search "*" --metrics.complexity ">10"
```

### 2. コードレビュー支援
```bash
# 変更ファイルをインデックス
function-indexer index --root ./src --include "**/changed/*.ts"

# 品質チェック
function-indexer metrics --threshold
```

### 3. リファクタリング計画
```bash
# 候補検索
function-indexer search "*" --metrics.loc ">50"

# 重複検索
function-indexer search "類似した関数名やパターン"
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

1. 常に最初に`index`を実行して最新データを作成
2. 特定の`--root`パスを使用してスコープを制限
3. 複数のメトリクスを組み合わせてより良い洞察を得る
4. 高度な処理のためにJSONL出力を保存
5. デバッグ時は`--verbose`を使用