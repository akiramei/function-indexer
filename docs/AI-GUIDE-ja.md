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
npx @akiramei/function-indexer

# 特定ディレクトリをスキャンして出力
npx @akiramei/function-indexer --root ./src --output functions.jsonl

# PRのメトリクスを収集
npx @akiramei/function-indexer collect-metrics --root ./src --pr 123 --metrics-output .quality/pr-123-metrics.jsonl

# またはプロジェクトにローカルインストール
npm install --save-dev @akiramei/function-indexer
npx function-indexer

# 代替: GitHub直接インストール（開発版）
npx github:akiramei/function-indexer
```

## コマンドリファレンス

### 1. メインコマンド - 関数インデックス生成
```bash
npx @akiramei/function-indexer --root <path> --output <file> [options]
```
**目的**: コードベースをスキャンし、すべての関数をJSONLファイルに出力
**オプション**:
- `--root, -r`: スキャンディレクトリ（デフォルト: 自動検出）
- `--output, -o`: 出力ファイル（デフォルト: .function-indexer/ 内に自動生成）
- `--verbose, -v`: 詳細な進捗表示

**注意**: Function Indexerは設定不要で動作します - `npx @akiramei/function-indexer` を実行するだけで開始できます！

**出力場所**: プロジェクトルートの`function-index.jsonl`（可視的でアクセス可能！）

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

**主要改善**: インデックスファイルが可視性向上のためプロジェクトルートに作成されるようになりました！

### 2. `search` - 関数検索（改善済み！）
```bash
npx @akiramei/function-indexer search <query> [options]
```
**目的**: 名前、内容、自然言語で関数を検索
**オプション**:
- `--context, -c`: 検索のコンテキストを提供
- `--limit, -l`: 最大結果数（デフォルト: 100）- **10から増加！**
- `--all`: すべての結果を表示（制限なし）- **新機能！**
- `--no-save-history`: 検索履歴を保存しない

**使用例**:
```bash
# 名前で検索（デフォルトで最大100件表示）
npx @akiramei/function-indexer search "validate"

# マッチしたすべての結果を表示（制限なし）
npx @akiramei/function-indexer search "validate" --all

# プロジェクト内のすべての関数を表示（空クエリ + --all）
npx @akiramei/function-indexer search "" --all

# ワイルドカード検索ですべての関数を表示
npx @akiramei/function-indexer search "*" --all

# コンテキスト付き自然言語検索
npx @akiramei/function-indexer search "認証" --context "ログインとセキュリティ"

# カスタム制限
npx @akiramei/function-indexer search "コンポーネント" --limit 50
```

**主な改善点**:
- **10倍の結果**: デフォルト制限を10から100に増加
- **無制限検索**: `--all`ですべてのマッチした関数を表示
- **グローバル検索**: 空クエリ`""`と`--all`でコードベース全体を表示
- **スマート切り捨て**: 結果が制限された際の明確な表示と使用ヒント

### 3. `metrics` - コード品質分析
```bash
npx @akiramei/function-indexer metrics [options]
```
**目的**: コード品質メトリクスと違反を表示
**オプション**:
- `--details, -d`: 関数レベルの詳細メトリクスを表示

**出力例**:
```text
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
npx @akiramei/function-indexer collect-metrics --root <path> [options]
```
**目的**: SQLiteデータベースにメトリクスを保存しトレンド分析（オプションでJSONLエクスポート）
**オプション**:
- `--metrics-output <file>`: メトリクス履歴用JSONLファイル出力（オプション）
- `--verbose-metrics`: メトリクス収集の詳細出力
- `--pr`: PR番号と関連付け
- `--branch`: Gitブランチ名
- `--commit`: 特定のコミットハッシュ

**使用例**:
```bash
# データベースのみに保存
npx @akiramei/function-indexer collect-metrics --root ./src --pr 123

# データベースとJSONLファイルの両方に保存
npx @akiramei/function-indexer collect-metrics --root ./src --metrics-output .quality/metrics-history.jsonl

# 詳細出力付き
npx @akiramei/function-indexer collect-metrics --root ./src --metrics-output .quality/metrics-history.jsonl --verbose-metrics
```

### 5. `show-metrics` - 関数履歴表示
```bash
npx @akiramei/function-indexer show-metrics [function-path]
```
**目的**: 特定関数のメトリクス履歴を表示または利用可能な関数を一覧表示
**形式**: "file:functionName" または "file:className.methodName"
**オプション**:
- `--limit, -l`: 履歴エントリ数の制限（デフォルト: 10）
- `--list`: メトリクスデータを持つ全関数をリスト表示

**使用例**:
```bash
# メトリクスデータを持つ全関数をリスト表示
npx @akiramei/function-indexer show-metrics
npx @akiramei/function-indexer show-metrics --list

# 特定関数の履歴表示
npx @akiramei/function-indexer show-metrics "src/auth.ts:validateToken"
```

### 6. `diff` - ブランチ/コミット間の関数比較
```bash
npx @akiramei/function-indexer diff [base] [target]
```
**目的**: Gitブランチまたはコミット間で関数を比較 - **フェーズ管理に最適**
**引数**:
- `base`: ベースブランチまたはコミット（デフォルト: main）
- `target`: ターゲットブランチまたはコミット（デフォルト: HEAD）
**オプション**:
- `--root, -r`: プロジェクトルートディレクトリ
- `--output, -o`: 出力ファイルパス
- `--format, -f`: 出力形式（terminal, markdown, json）
- `--thresholds <json>`: カスタム複雑度閾値をJSON形式で指定

**使用例**:
```bash
# フェーズ1 vs フェーズ2の比較（コミットハッシュ使用）
npx @akiramei/function-indexer diff abc123f def456g --format markdown --output phase-comparison.md

# 現在のブランチとmainブランチの比較
npx @akiramei/function-indexer diff main HEAD --format json

# カスタム閾値での比較
npx @akiramei/function-indexer diff main HEAD --thresholds '{"cyclomaticComplexity":15,"linesOfCode":50}'
```

**出力内容**:
- 追加、変更、削除された関数
- 品質メトリクスの変化（複雑度の増減など）
- 閾値を超えた関数
- 要約統計

### 7. `report` - 包括的コード品質レポート生成
```bash
npx @akiramei/function-indexer report [options]
```
**目的**: ステークホルダー向けの詳細で共有可能なコード品質レポートを生成
**オプション**:
- `--template, -t <path>`: カスタムHandlebarsテンプレートパス
- `--output, -o <path>`: 出力ファイルパス（デフォルト: 標準出力）
- `--format, -f <format>`: 出力形式（markdown, html, json）（デフォルト: markdown）
- `--thresholds <json>`: カスタム複雑度閾値をJSON形式で指定

**使用例**:
```bash
# フェーズレビュー用Markdownレポート生成
npx @akiramei/function-indexer report --format markdown --output phase2-quality-report.md

# 管理層向けHTMLレポート生成
npx @akiramei/function-indexer report --format html --output quality-dashboard.html

# 更なる分析用JSONデータ生成
npx @akiramei/function-indexer report --format json --output metrics-data.json

# 企業標準向けカスタム閾値
npx @akiramei/function-indexer report --thresholds '{"cyclomaticComplexity":8,"cognitiveComplexity":12}'
```

**レポート内容**:
- 全体的な品質メトリクス概要
- 複雑度閾値を超えた関数
- 品質分布チャート（HTML形式）
- 改善提案
- ファイル別詳細分析

### 8. `ci` - CI/CDパイプライン統合
```bash
npx @akiramei/function-indexer ci [options]
```
**目的**: PR統合機能を備えたCI/CDパイプライン向け自動品質分析
**オプション**:
- `--root, -r <path>`: プロジェクトルートディレクトリ
- `--base, -b <branch>`: 比較用ベースブランチ
- `--output, -o <path>`: 結果出力ファイル
- `--format, -f <format>`: 出力形式（terminal, github, gitlab, json）
- `--thresholds <json>`: カスタム複雑度閾値をJSON形式で指定
- `--fail-on-violation`: 違反検出時にエラーコードで終了
- `--no-fail-on-violation`: 違反検出時もエラーコードで終了しない
- `--comment`: PR/MRコメント生成（GitHub/GitLab用）
- `--verbose, -v`: 詳細出力を有効化

**使用例**:
```bash
# GitHub Actions統合
npx @akiramei/function-indexer ci --format github --base main --fail-on-violation

# PRコメント付きGitLab CI
npx @akiramei/function-indexer ci --format gitlab --comment --base main

# カスタム品質ゲート
npx @akiramei/function-indexer ci --thresholds '{"cyclomaticComplexity":10}' --fail-on-violation

# カスタム処理用JSON出力
npx @akiramei/function-indexer ci --format json --output ci-results.json
```

**機能**:
- 自動ベースブランチ検出
- 品質ゲート強制（違反時のビルド失敗）
- 品質概要付きPR/MRコメント生成
- 複数CIプラットフォーム対応（GitHub, GitLab）
- 既存品質閾値との統合

### 9. その他のコマンド
- `analyze-trends`: メトリクストレンドと違反の分析
- `pr-metrics <prNumber>`: 特定PRのメトリクス表示
- `update <index>`: 既存の関数インデックスを更新
- `validate <index>`: インデックスの整合性検証
- `backup <index>`: インデックスのバックアップ作成
- `restore <backupId>`: バックアップから復元

## フェーズ管理ワークフロー

Function Indexerは**フェーズベース開発における品質管理**のために設計されています。開発フェーズ間での品質追跡方法は以下の通りです：

### フェーズセットアップとベースライン収集
```bash
# フェーズ1完了時 - ベースライン確立
git tag phase-1-complete
npx @akiramei/function-indexer collect-metrics --root ./src --metrics-output .quality/phase1-metrics.jsonl
npx @akiramei/function-indexer report --format html --output .quality/phase1-quality-report.html
```

### フェーズ移行と比較
```bash
# フェーズ2完了時 - 新しいメトリクス収集
git tag phase-2-complete
npx @akiramei/function-indexer collect-metrics --root ./src --metrics-output .quality/phase2-metrics.jsonl

# コミット/タグを使用したフェーズの直接比較
npx @akiramei/function-indexer diff phase-1-complete phase-2-complete --format markdown --output .quality/phase1-vs-phase2-comparison.md

# 包括的なフェーズ2レポート生成
npx @akiramei/function-indexer report --format html --output .quality/phase2-quality-report.html
```

### 品質変化の特定
```bash
# 大幅な変化のある関数を検索
npx @akiramei/function-indexer diff phase-1-complete phase-2-complete --format json | jq '.modified[] | select(.metrics.cyclomaticComplexity.change > 5)'

# 現在の違反分析
npx @akiramei/function-indexer analyze-trends

# フェーズ間での特定関数の履歴
npx @akiramei/function-indexer show-metrics "src/core/processor.ts:processData" --limit 10
```

### 管理レポート作成
```bash
# エグゼクティブサマリーレポート（チャート付きHTML）
npx @akiramei/function-indexer report --format html --output executive-quality-summary.html

# 技術チーム向けレポート（詳細Markdown）
npx @akiramei/function-indexer report --format markdown --output technical-quality-details.md

# 外部ツール向けデータエクスポート
npx @akiramei/function-indexer report --format json --output quality-metrics.json
```

## AIタスクテンプレート

### タスク1: リファクタリング対象の複雑な関数を検索
```
function-indexerを使用して、src/ディレクトリ内の循環的複雑度が10を超えるすべての関数を見つけ、リファクタリングの優先順位を提案してください。

実行コマンド:
1. npx @akiramei/function-indexer --root ./src
2. npx @akiramei/function-indexer metrics --details
```

### タスク2: フェーズ品質比較分析
```
開発フェーズ間の品質変化を比較して、懸念すべき領域を特定してください：

実行コマンド:
1. npx @akiramei/function-indexer diff phase-1-complete phase-2-complete --format markdown --output phase-comparison.md
2. npx @akiramei/function-indexer analyze-trends
3. npx @akiramei/function-indexer report --format html --output current-quality-dashboard.html

期待される出力:
- 関数レベルでの変更を示すMarkdown比較レポート
- 品質閾値を超えた関数リスト
- ステークホルダー向けHTMLダッシュボード
```

### タスク3: PR品質ゲート分析
```
PR #123をマージする前に、コード品質への影響を分析してください：

実行コマンド:
1. npx @akiramei/function-indexer ci --base main --format github --fail-on-violation
2. npx @akiramei/function-indexer collect-metrics --root ./src --pr 123 --metrics-output .quality/pr-123-metrics.jsonl
3. npx @akiramei/function-indexer pr-metrics 123

または、設定済みのnpmスクリプトを使用:
1. npm run quality:collect
2. npm run quality:trends
```

### タスク4: 類似関数の検索
```
データベース操作を処理する関数を見つけてください：

実行コマンド:
1. npx @akiramei/function-indexer --root ./src
2. npx @akiramei/function-indexer search "database" --context "非同期操作"
```

### タスク5: 関数の成長監視
```
特定の関数が時間とともにどのように成長したかを追跡してください：

実行コマンド:
1. npx @akiramei/function-indexer show-metrics "src/core/processor.ts:processData" --limit 10
```

## 統合パターン

### CI/CDパイプライン統合
```yaml
# GitHub Actions例（npmパッケージ使用）
- name: コード品質分析
  run: |
    sudo apt-get update && sudo apt-get install -y build-essential python3-dev
    npx @akiramei/function-indexer collect-metrics --root ./src --pr ${{ github.event.number }}
    npx @akiramei/function-indexer ci --format github

# 代替: GitHub Actions（ローカルビルド）
- name: コード品質分析
  run: |
    sudo apt-get update && sudo apt-get install -y build-essential python3-dev
    npm ci
    npm run build
    node dist/cli.js collect-metrics --root ./src --pr ${{ github.event.number }}
    node dist/cli.js ci --format github
```

### Pre-commitフック
```bash
#!/bin/bash
# .git/hooks/pre-commit
npx @akiramei/function-indexer metrics --details --root ./src
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
  "command": "npx @akiramei/function-indexer search '*' --metrics.complexity '>10'",
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
npx @akiramei/function-indexer metrics --root ./src

# エントリポイント検索
npx @akiramei/function-indexer search "main" --exported true

# 複雑な領域検索
npx @akiramei/function-indexer search "*" --metrics.complexity ">10"
```

### 2. コードレビュー支援
```bash
# 変更ファイルをインデックス
npx @akiramei/function-indexer index --root ./src --include "**/changed/*.ts"

# 品質チェック
npx @akiramei/function-indexer metrics --threshold
```

### 3. リファクタリング計画
```bash
# 候補検索
npx @akiramei/function-indexer search "*" --metrics.loc ">50"

# 重複検索
npx @akiramei/function-indexer search "類似した関数名やパターン"
```

## 出力処理のヒント

1. **JSONL解析**: 各行が完全なJSONオブジェクト
2. **メトリクスでフィルタ**: jqなどのツールを使用
3. **変更追跡**: hash_function値を比較
4. **ファイル別グループ化**: モジュール単位でメトリクスを集計

## クイック判断ガイド

- **関数を見つけたい？** → `search`コマンド使用
- **品質の概要が欲しい？** → `metrics`コマンド使用
- **フェーズ/ブランチ比較？** → `diff`コマンド使用
- **包括的レポートが必要？** → `report`コマンド使用
- **自動化を構築？** → メインコマンド + JSONL解析
- **時系列トレンド追跡？** → `collect-metrics` + `analyze-trends`使用
- **コード変更レビュー？** → `metrics --details`または`diff`コマンド使用
- **CI/CD統合？** → `ci`コマンド使用
- **管理レポート作成？** → `report --format html`使用
- **フェーズ管理？** → `diff` + `collect-metrics` + `report`使用

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

## ゼロショットAIアシスタント向けガイド

AIアシスタントがFunction Indexerを使用したコード品質管理の支援を求められた場合、以下のパターンに従ってください：

### フェーズベース品質管理の場合:
1. **ベースライン確立**: `collect-metrics` + `report`
2. **フェーズ比較**: `diff [phase1-commit] [phase2-commit]`
3. **レポート生成**: `report --format html`
4. **変更追跡**: 特定関数に対する`show-metrics`

### PR/MR品質ゲートの場合:
1. **品質チェック**: `ci --base main --fail-on-violation`
2. **詳細分析**: `diff main HEAD --format markdown`
3. **データ収集**: `collect-metrics --pr [number]`

### 一般的な品質分析の場合:
1. **概要**: `metrics`または`metrics --details`
2. **問題発見**: `analyze-trends`
3. **関数検索**: `search [query] --context [context]`
4. **データエクスポート**: `report --format json`

### 用途別主要コマンド:
- **エグゼクティブレポート**: `report --format html`
- **技術分析**: `diff` + `metrics --details`
- **CI/CD統合**: `ci --format github`
- **履歴追跡**: `collect-metrics` + `show-metrics`

## 設定ファイルサポート

Function Indexer は **プロジェクト固有の設定** をJSONファイルでサポートしています：

**ファイル場所**: `.function-indexer/config.json` (初回実行時に自動作成)

**設定例**:
```json
{
  "version": "1.0.0",
  "root": "src",
  "output": ".function-indexer/index.jsonl",
  "domain": "main",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"],
  "metrics": {
    "thresholds": {
      "cyclomaticComplexity": 8,
      "cognitiveComplexity": 12,
      "linesOfCode": 30,
      "nestingDepth": 3,
      "parameterCount": 3
    }
  }
}
```

**設定機能**:
- **カスタム品質閾値**: プロジェクト固有の複雑度、コード行数、その他メトリクス制限を設定
- **Include/Excludeパターン**: スキャンするファイルや無視するファイルをGlobパターンで定義
- **ルートディレクトリ**: デフォルトスキャンディレクトリを設定
- **出力パス**: 関数インデックスの保存場所をカスタマイズ
- **自動統合**: すべてのコマンドが設定ファイルの設定を尊重

**デフォルト閾値**:
- 循環的複雑度: 10
- 認知的複雑度: 15
- コード行数: 50
- ネスト深度: 4
- パラメータ数: 4

## 新規プロジェクトのクイックセットアップ

新しいプロジェクトのコード品質管理を設定する場合：

```bash
# 1. 前提条件インストール（Linux/WSLのみ）
sudo apt-get update && sudo apt-get install -y build-essential python3-dev

# 2. プロジェクト初期化（.function-indexer/config.jsonを自動作成）
cd your-project
npx @akiramei/function-indexer

# 3. 設定のカスタマイズ（オプション）
# .function-indexer/config.json を編集して希望する閾値とパターンを設定

# 4. 現在の品質状態を確認
npx @akiramei/function-indexer metrics --details

# 5. 継続的な監視を設定
npx @akiramei/function-indexer collect-metrics --pr $PR_NUMBER

# 6. package.jsonスクリプトに追加（オプション）
npm pkg set scripts.quality="npx @akiramei/function-indexer metrics"
npm pkg set scripts.quality:detailed="npx @akiramei/function-indexer metrics --details"
npm pkg set scripts.quality:collect="npx @akiramei/function-indexer collect-metrics --root ./src --metrics-output .quality/metrics-history.jsonl"
npm pkg set scripts.quality:show="npx @akiramei/function-indexer show-metrics --list"
npm pkg set scripts.quality:trends="npx @akiramei/function-indexer analyze-trends"

# 7. 品質スクリプトの使用
npm run quality          # コード品質概要を表示
npm run quality:collect  # .quality/metrics-history.jsonl にメトリクス収集
npm run quality:show     # メトリクスデータ付きの全関数を一覧表示
npm run quality:trends   # トレンドと違反を分析

# 8. GitHub Actionを作成（.github/workflows/code-quality.ymlとして保存）
echo 'name: Code Quality Check
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: |
          sudo apt-get update && sudo apt-get install -y build-essential python3-dev
          npm ci && npm run build
          node dist/cli.js ci --format github' > .github/workflows/code-quality.yml

