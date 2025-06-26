# 📚 Function Indexer - AI最適化コマンドリファレンス

**AIアシスタント向け包括的コマンドガイド** | Version 1.1.0

## 🎯 コマンドカテゴリ

### 🔍 コアコマンド（高優先度 - 日常使用）
関数の発見とインデックス化 - **AI使用の90%**

### 📊 メトリクスコマンド（中優先度 - 品質重視）
コード品質分析と追跡 - **AI使用の10%**

### 🔧 開発コマンド（中優先度 - ワークフロー統合）
CI/CDと開発ワークフローのサポート

### 🛠️ 管理コマンド（低優先度 - メンテナンス）
バックアップ、修復、およびメンテナンス操作

## 🚀 クイックコマンド検索

| タスク | コマンド | 優先度 | カテゴリ |
|--------|----------|--------|----------|
| **初回セットアップ** | `npx @akiramei/function-indexer` | 高 | コア |
| **インデックス更新** | `function-indexer` | 高 | コア |
| **関数検索** | `function-indexer search <query>` | 高 | コア |
| **関数一覧** | `function-indexer list` | 高 | コア |
| **品質メトリクス表示** | `function-indexer metrics` | 中 | メトリクス |
| **メトリクス収集** | `function-indexer collect-metrics` | 中 | メトリクス |
| **ブランチ比較** | `function-indexer diff` | 中 | 開発 |
| **レポート生成** | `function-indexer report` | 中 | 開発 |
| **CI/CDチェック** | `function-indexer ci` | 中 | 開発 |
| **インデックス検証** | `function-indexer validate` | 低 | 管理 |

---

## 🔍 コアコマンド（高優先度）

### `function-indexer`（デフォルトコマンド）

**目的**: TypeScript/TSXコードベースの関数インデックスを生成または更新  
**カテゴリ**: コア  
**優先度**: 高  
**AI使用**: あらゆるプロジェクトで最初に実行するコマンド、すべての操作の基準を確立

#### 構文
```bash
function-indexer [options]
```

#### オプション
- `--root, -r <path>` - スキャンするルートディレクトリ（文字列、デフォルト: 自動検出）
- `--output, -o <file>` - 出力ファイルパス（文字列、デフォルト: .function-indexer/index.jsonl）
- `--verbose, -v` - 詳細出力（ブール値、デフォルト: false）
- `--domain <name>` - ドメイン識別子（文字列、デフォルト: "main"）

#### 出力フォーマット
各行が以下の形式のJSONを含むJSONLファイルを作成：
```json
{
  "file": "src/utils/auth.ts",
  "identifier": "validateToken",
  "signature": "async function validateToken(token: string): Promise<boolean>",
  "startLine": 15,
  "endLine": 28,
  "hash_function": "a1b2c3d4",
  "hash_file": "e5f6g7h8",
  "exported": true,
  "async": true,
  "metrics": {
    "linesOfCode": 12,
    "cyclomaticComplexity": 3,
    "cognitiveComplexity": 4,
    "nestingDepth": 2,
    "parameterCount": 1,
    "hasReturnType": true
  },
  "domain": "main"
}
```

#### 例
```bash
# 初回セットアップ（ゼロ設定）
npx @akiramei/function-indexer

# 既存インデックスの更新
function-indexer

# 特定ディレクトリをカスタム出力でインデックス化
function-indexer --root ./src --output functions.jsonl --verbose

# ドメイン識別子付きインデックス化
function-indexer --domain "auth-module"
```

#### AI統合ノート
- **常に最初に実行**: 関数インデックスのベースラインを確立
- **出力の存在確認**: 他の操作前にインデックスファイルの存在を確認
- **デバッグ時は詳細出力を使用**: トラブルシューティング時に--verboseを追加
- **パフォーマンス**: 平均的なハードウェアで約1000ファイル/秒を処理
- **メモリ使用量**: 10,000関数あたり約100MB
- **エラー処理**: パースエラーでも続行、stderrにログ出力

---

### `search`

**目的**: 名前、目的、コンテキストによる関数の自然言語検索  
**カテゴリ**: コア  
**優先度**: 高  
**AI使用**: 関連する関数を見つけるための主要な発見ツール

#### 構文
```bash
function-indexer search <query> [options]
```

#### 引数
- `query` - 検索クエリ（必須、自然言語をサポート）

#### オプション
- `--limit <number>` - 最大結果数（数値、デフォルト: 100）
- `--all` - 制限なしですべての結果を表示（ブール値、デフォルト: false）
- `--context <string>` - 追加の検索コンテキスト（文字列）
- `--min-score <number>` - 最小関連性スコア 0-1（数値、デフォルト: 0.1）
- `--format <type>` - 出力形式: text|json|jsonl（文字列、デフォルト: text）

#### 出力フォーマット
デフォルトのテキスト形式：
```
🔍 "authentication" の検索結果：

1. src/auth/tokenValidator.ts:validateToken (スコア: 0.95)
   async function validateToken(token: string): Promise<boolean>
   行: 15-28 | 複雑度: 3

2. src/auth/userAuth.ts:authenticateUser (スコア: 0.89)
   export async function authenticateUser(credentials: UserCredentials): Promise<User>
   行: 42-78 | 複雑度: 5
```

JSON形式（`--format json`）：
```json
{
  "query": "authentication",
  "total": 2,
  "results": [
    {
      "file": "src/auth/tokenValidator.ts",
      "identifier": "validateToken",
      "signature": "async function validateToken(token: string): Promise<boolean>",
      "score": 0.95,
      "startLine": 15,
      "endLine": 28,
      "metrics": { "cyclomaticComplexity": 3 }
    }
  ]
}
```

#### 例
```bash
# 基本検索
function-indexer search "認証"

# コンテキスト付き検索
function-indexer search "検証" --context "ユーザー入力"

# JSON形式ですべての結果を取得
function-indexer search "非同期関数" --all --format json

# 高関連性検索
function-indexer search "メインエントリポイント" --min-score 0.8
```

#### AI統合ノート
- **自然言語クエリ**: キーワード照合だけでなくセマンティック検索をサポート
- **コンテキストで精度向上**: ドメイン固有の検索には--contextを使用
- **スコア解釈**: >0.8 = 高関連性、0.5-0.8 = 中程度、<0.5 = 低
- **パフォーマンス**: 10万関数を100ms未満で検索
- **ベストプラクティス**: 広範に開始し、コンテキストで絞り込む

---

### `list`

**目的**: フィルタリングオプション付きですべてのインデックス化された関数を一覧表示  
**カテゴリ**: コア  
**優先度**: 高  
**AI使用**: 分析のために関数を列挙、インベントリを生成

#### 構文
```bash
function-indexer list [options]
```

#### オプション
- `--filter <pattern>` - ファイルパスパターンでフィルタ（文字列）
- `--exported` - エクスポートされた関数のみ表示（ブール値）
- `--async` - 非同期関数のみ表示（ブール値）
- `--sort <field>` - ソート基準: name|file|complexity|lines（文字列、デフォルト: file）
- `--format <type>` - 出力形式: text|json|csv（文字列、デフォルト: text）
- `--output <file>` - stdoutの代わりにファイルに保存（文字列）

#### 出力フォーマット
テキスト形式（デフォルト）：
```
📋 関数インベントリ（合計216個）

src/auth/tokenValidator.ts
  ├─ validateToken (非同期、エクスポート) - 行: 15-28
  └─ parseJWT (内部) - 行: 30-45

src/core/processor.ts
  ├─ processData (エクスポート) - 行: 10-125
  ├─ validateInput (内部) - 行: 130-145
  └─ formatOutput (内部) - 行: 150-180
```

#### 例
```bash
# すべての関数を一覧表示
function-indexer list

# エクスポートされた非同期関数のみ一覧表示
function-indexer list --exported --async

# パスでフィルタしCSVとして保存
function-indexer list --filter "src/auth/**" --format csv --output auth-functions.csv

# 複雑度でソート
function-indexer list --sort complexity --format json
```

#### AI統合ノート
- **インベントリに使用**: ドキュメント用の完全な関数リストを生成
- **フィルタの組み合わせ**: 複数のフィルタはANDロジックで動作
- **分析用CSV**: スプレッドシート分析のためにCSVにエクスポート
- **メモリ効率**: 出力をストリーミング、大規模コードベースに対応

---

## 📊 メトリクスコマンド（中優先度）

### `metrics`

**目的**: コード品質メトリクスの概要を表示し、高リスク関数を特定  
**カテゴリ**: メトリクス  
**優先度**: 中  
**AI使用**: コード品質評価、リファクタリング対象の特定

#### 構文
```bash
function-indexer metrics [options]
```

#### オプション
- `--details, -d` - 詳細な関数レベルのメトリクスを表示（ブール値）
- `--threshold <metric:value>` - カスタム閾値（文字列、繰り返し可）
- `--format <type>` - 出力形式: text|json|html（文字列、デフォルト: text）
- `--output <file>` - レポートをファイルに保存（文字列）

#### 出力フォーマット
サマリービュー：
```
📊 コード品質メトリクス

📈 サマリー
   総関数数: 216
   平均複雑度: 3.4
   閾値を超える関数: 12

📊 分布
   🟢 低リスク: 180 (83%)
   🟡 中リスク: 24 (11%)
   🔴 高リスク: 12 (6%)

⚠️  トップ問題:
   1. src/core/processor.ts:processData
      - 循環的複雑度: 15 (閾値: 10)
      - コード行数: 115 (閾値: 50)
```

JSON形式（`--format json`）：
```json
{
  "summary": {
    "totalFunctions": 216,
    "averageComplexity": 3.4,
    "violationCount": 12
  },
  "distribution": {
    "low": 180,
    "medium": 24,
    "high": 12
  },
  "violations": [
    {
      "function": "processData",
      "file": "src/core/processor.ts",
      "violations": [
        { "metric": "cyclomaticComplexity", "value": 15, "threshold": 10 }
      ]
    }
  ]
}
```

#### 例
```bash
# 基本的なメトリクス概要
function-indexer metrics

# カスタム閾値を使用した詳細メトリクス
function-indexer metrics --details --threshold complexity:8 --threshold lines:40

# HTMLレポートの生成
function-indexer metrics --format html --output metrics-report.html
```

#### AI統合ノート
- **リスク評価**: 分布を使用してコード全体の健全性を評価
- **違反による優先順位付け**: 複数の違反がある関数に焦点を当てる
- **閾値の調整**: プロジェクト標準に基づいて閾値を調整
- **トレンド追跡**: collect-metricsを使用して時系列でメトリクスを比較

---

### `collect-metrics`

**目的**: 履歴追跡とトレンド分析のためのメトリクスを収集して保存  
**カテゴリ**: メトリクス  
**優先度**: 中  
**AI使用**: メトリクス履歴の構築、時系列での品質追跡

#### 構文
```bash
function-indexer collect-metrics [options]
```

#### オプション
- `--root <path>` - ルートディレクトリ（文字列、デフォルト: ./src）
- `--pr <number>` - 追跡用のPR番号（数値）
- `--commit <hash>` - 特定のコミットハッシュ（文字列、デフォルト: HEAD）
- `--branch <name>` - ブランチ名（文字列、デフォルト: 現在のブランチ）
- `--verbose` - 詳細出力（ブール値）

#### 出力フォーマット
コンソール出力：
```
📊 関数メトリクスを収集中...
✅ 45ファイル、216関数を処理
📈 メトリクスをデータベースに保存
🔍 新しい違反を検出: 3
```

データベース保存（SQLite）：
- 場所: `.function-metrics/metrics.db`
- スキーマ: function_id、timestamp、すべてのメトリクス、コミット情報を含む

#### 例
```bash
# 現在の状態のメトリクスを収集
function-indexer collect-metrics

# 特定のPRのメトリクスを収集
function-indexer collect-metrics --pr 123

# 特定のコミットのメトリクスを収集
function-indexer collect-metrics --commit abc123 --branch feature-x
```

#### AI統合ノート
- **CI/CD統合**: 継続的な追跡のために毎回のコミットで実行
- **PR追跡**: プルリクエストのコンテキストでは常に--prを含める
- **データベースの場所**: `.function-metrics/metrics.db`の存在を確認
- **パフォーマンス**: インクリメンタル収集、変更された関数のみ

---

### `show-metrics`

**目的**: 特定の関数の履歴メトリクスを表示  
**カテゴリ**: メトリクス  
**優先度**: 中  
**AI使用**: 関数の進化を追跡、劣化パターンを特定

#### 構文
```bash
function-indexer show-metrics [functionId] [options]
```

#### 引数
- `functionId` - "file:function"形式の関数識別子（オプション）

#### オプション
- `--limit <number>` - 履歴エントリの数（数値、デフォルト: 10）
- `--list` - メトリクスを持つすべての関数を一覧表示（ブール値）

#### 出力フォーマット
関数履歴：
```
📈 メトリクス履歴: src/core/processor.ts:processData

1. 2024-01-15 10:30:00 (コミット: abc123)
   ブランチ: main | PR: #45
   循環的複雑度: 12 → 15 (⬆️ +3)
   行数: 98 → 115 (⬆️ +17)
   認知的複雑度: 18 → 22 (⬆️ +4)

2. 2024-01-10 14:20:00 (コミット: def456)
   ブランチ: feature-x
   循環的複雑度: 10 → 12 (⬆️ +2)
   行数: 89 → 98 (⬆️ +9)
```

#### 例
```bash
# 特定の関数のメトリクスを表示
function-indexer show-metrics "src/auth.ts:validateToken"

# 追跡されているすべての関数を一覧表示
function-indexer show-metrics --list

# 拡張履歴を表示
function-indexer show-metrics "src/core.ts:main" --limit 50
```

#### AI統合ノート
- **トレンド検出**: 複雑度の一貫した増加を探す
- **PR相関**: 変更と相関させるためにPR番号を使用
- **関数命名**: 正確な"file:function"形式を使用
- **欠落データ**: 関数が追跡されていない場合は空を返す

---

### `analyze-trends`

**目的**: コードベース全体のメトリクストレンドを分析  
**カテゴリ**: メトリクス  
**優先度**: 中  
**AI使用**: システミックな問題を特定、リファクタリング優先順位をガイド

#### 構文
```bash
function-indexer analyze-trends [options]
```

#### オプション
- `--period <days>` - 分析期間（日数、デフォルト: 30）
- `--min-change <percent>` - 最小変化率（数値、デフォルト: 10）

#### 出力フォーマット
```
📊 メトリクストレンド分析（過去30日間）

🔴 劣化している関数 (5)
1. src/api/handler.ts:processRequest
   複雑度: 8 → 14 (+75%)
   トレンド: 着実に増加

🟢 改善している関数 (3)
1. src/utils/validator.ts:checkInput
   複雑度: 12 → 7 (-42%)
   トレンド: PR #89でリファクタリング

📈 全体的なトレンド
- 平均複雑度: 3.2 → 3.8 (+19%)
- 高リスク関数: 8 → 12 (+50%)
- コードカバレッジ: 78% → 82% (+4%)
```

#### 例
```bash
# 過去30日間を分析
function-indexer analyze-trends

# 重要な変更を含む過去四半期を分析
function-indexer analyze-trends --period 90 --min-change 20
```

#### AI統合ノート
- **劣化に焦点**: 負のトレンドを持つ関数を優先
- **PRとの相関**: コンテキストのためにPR番号を確認
- **システミックな問題**: 複数の劣化関数はアーキテクチャの問題を示す可能性

---

### `pr-metrics`

**目的**: 特定のプルリクエストのメトリクス変更を表示  
**カテゴリ**: メトリクス  
**優先度**: 中  
**AI使用**: PRレビューサポート、品質ゲートチェック

#### 構文
```bash
function-indexer pr-metrics <prNumber>
```

#### 引数
- `prNumber` - プルリクエスト番号（必須）

#### 出力フォーマット
```
📊 PR #123のメトリクス

📈 サマリー
- 変更された関数: 12
- 新しい違反: 3
- 解決された違反: 1

🔴 新しい問題
1. src/api/newEndpoint.ts:handleRequest
   - 循環的複雑度: 12（閾値を超過: 10）
   - 戻り値の型注釈がない

🟢 改善
1. src/utils/helper.ts:formatData
   - 複雑度削減: 8 → 4
```

#### 例
```bash
# PRメトリクスを表示
function-indexer pr-metrics 123
```

#### AI統合ノート
- **品質ゲート**: 承認前に新しい違反をチェック
- **レビューフォーカス**: 高複雑度の追加にレビュアーを誘導
- **CI統合**: 自動品質ゲートのためにPRチェックで使用

---

## 🔧 開発コマンド（中優先度）

### `diff`

**目的**: コミット、ブランチ、またはインデックスファイル間の関数の変更を比較  
**カテゴリ**: 開発  
**優先度**: 中  
**AI使用**: コードレビュー、影響分析、変更追跡

#### 構文
```bash
function-indexer diff [base] [target] [options]
```

#### 引数
- `base` - ベース参照（コミット/ブランチ/ファイル、デフォルト: main）
- `target` - ターゲット参照（コミット/ブランチ/ファイル、デフォルト: HEAD）

#### オプション
- `--format <type>` - 出力形式: text|json|html（文字列、デフォルト: text）
- `--filter <pattern>` - ファイルパターンでフィルタ（文字列）
- `--only-changes` - 変更された関数のみ表示（ブール値）

#### 出力フォーマット
```
📊 関数差分: main...feature-branch

➕ 追加 (3関数)
  src/auth/newAuth.ts:validateAPIKey
  src/auth/newAuth.ts:refreshToken
  src/utils/crypto.ts:hashPassword

➖ 削除 (1関数)
  src/auth/oldAuth.ts:legacyAuth

🔄 変更 (5関数)
  src/core/processor.ts:processData
    複雑度: 8 → 12 (+4)
    行数: 45 → 67 (+22)
    シグネチャ変更: オプショナルパラメータを追加
```

#### 例
```bash
# mainブランチと比較
function-indexer diff

# 特定のブランチを比較
function-indexer diff main feature-branch

# インデックスファイルを比較
function-indexer diff old-index.jsonl new-index.jsonl

# パスでフィルタ
function-indexer diff --filter "src/auth/**" --only-changes
```

#### AI統合ノート
- **変更の影響**: 追加/削除数を影響評価に使用
- **複雑度の増加**: 複雑度が増加している関数をフラグ
- **シグネチャの変更**: 破壊的変更を示す可能性
- **パフォーマンス**: 1万関数を500ms未満で比較

---

### `report`

**目的**: 包括的なコード品質レポートを生成  
**カテゴリ**: 開発  
**優先度**: 中  
**AI使用**: ドキュメント生成、品質レポート

#### 構文
```bash
function-indexer report [options]
```

#### オプション
- `--format <type>` - レポート形式: markdown|html|pdf（文字列、デフォルト: markdown）
- `--output <file>` - 出力ファイルパス（文字列、必須）
- `--include-metrics` - 詳細なメトリクスを含む（ブール値、デフォルト: true）
- `--include-trends` - トレンド分析を含む（ブール値、デフォルト: false）

#### 出力フォーマット
フォーマットされたレポートを生成：
- エグゼクティブサマリー
- メトリクス概要
- 高リスク関数
- 複雑度分布
- 推奨事項

#### 例
```bash
# マークダウンレポートを生成
function-indexer report --format markdown --output quality-report.md

# トレンド付きHTMLレポートを生成
function-indexer report --format html --output report.html --include-trends

# クイックPDFサマリー
function-indexer report --format pdf --output summary.pdf --no-include-metrics
```

#### AI統合ノート
- **自動化**: 週次/月次レポート生成をスケジュール
- **ステークホルダーコミュニケーション**: 非技術者向けにHTML/PDFを使用
- **PRドキュメント**: 重要なPRのレポートを生成
- **カスタマイズ**: レポートは`.function-indexer/templates/`のテンプレートを使用

---

### `ci`

**目的**: 設定可能な品質ゲートを持つCI/CD統合  
**カテゴリ**: 開発  
**優先度**: 中  
**AI使用**: 自動品質チェック、PR検証

#### 構文
```bash
function-indexer ci [options]
```

#### オプション
- `--format <type>` - CI形式: github|gitlab|jenkins|azure（文字列、デフォルト: github）
- `--fail-on-violation` - 違反時にエラーで終了（ブール値、デフォルト: true）
- `--comment` - 結果をPRコメントとして投稿（ブール値、デフォルト: false）
- `--baseline <file>` - 比較用のベースラインメトリクスファイル（文字列）

#### 出力フォーマット
GitHub Actions形式：
```
::error file=src/core/processor.ts,line=45::関数 'processData' が複雑度閾値を超過 (15 > 10)
::warning file=src/api/handler.ts,line=23::関数 'handleRequest' のネスト深度が高い (5 > 4)
```

終了コード：
- 0: すべてのチェックに合格
- 1: 違反が見つかった（--fail-on-violationの場合）
- 2: 分析中のエラー

#### 例
```bash
# GitHub Actions
function-indexer ci --format github --fail-on-violation

# PRコメント付きGitLab CI
function-indexer ci --format gitlab --comment

# ベースラインと比較
function-indexer ci --baseline .metrics-baseline.json
```

#### AI統合ノート
- **終了コード**: 条件付きCIステップに使用
- **形式選択**: CI環境変数から自動検出
- **ベースライン比較**: 段階的な劣化を防ぐ
- **パフォーマンス**: CI用に最適化、最小限の出力

---

### `generate-descriptions`

**目的**: LLMを使用して関数のAI記述を生成  
**カテゴリ**: 開発  
**優先度**: 低  
**AI使用**: ドキュメント生成、コード理解

#### 構文
```bash
function-indexer generate-descriptions [options]
```

#### オプション
- `--input <file>` - 入力インデックスファイル（文字列、デフォルト: function-index.jsonl）
- `--output <file>` - 記述付き出力ファイル（文字列、デフォルト: enhanced.jsonl）
- `--batch-size <number>` - LLMバッチサイズ（数値、デフォルト: 10）
- `--model <name>` - 使用するLLMモデル（文字列、デフォルト: 環境変数から）

#### 出力フォーマット
記述フィールドを追加した拡張JSONL：
```json
{
  "file": "src/auth.ts",
  "identifier": "validateToken",
  "description": "署名、有効期限、クレームをチェックしてJWTトークンを検証します。有効な場合はtrue、そうでない場合はfalseを返します。形式が正しくないトークンの場合は例外をスローします。",
  "signature": "async function validateToken(token: string): Promise<boolean>",
  // ... その他のフィールド
}
```

#### 例
```bash
# デフォルトで生成
function-indexer generate-descriptions

# カスタムモデルとバッチサイズ
function-indexer generate-descriptions --model gpt-4 --batch-size 20

# 特定の入力/出力
function-indexer generate-descriptions --input index.jsonl --output described.jsonl
```

#### AI統合ノート
- **APIキーが必要**: OPENAI_API_KEYまたはANTHROPIC_API_KEYを設定
- **コスト考慮**: GPT-3.5で100関数あたり約$0.01
- **バッチ処理**: レート制限に合わせて調整可能
- **インクリメンタル**: 記述のない関数のみ処理

---

## 🛠️ 管理コマンド（低優先度）

### `validate`

**目的**: インデックスの整合性を検証し、不整合をチェック  
**カテゴリ**: 管理  
**優先度**: 低  
**AI使用**: メンテナンスタスク、トラブルシューティング

#### 構文
```bash
function-indexer validate [options]
```

#### オプション
- `--input <file>` - 検証するインデックスファイル（文字列、デフォルト: 自動検出）
- `--fix` - 問題の修正を試みる（ブール値、デフォルト: false）
- `--verbose` - 詳細な検証情報を表示（ブール値）

#### 出力フォーマット
```
🔍 インデックスを検証中: .function-indexer/index.jsonl

✅ フォーマット検証: 合格
✅ ハッシュ検証: 合格
⚠️  ファイル存在性: 2つのファイルが見つかりません
❌ 重複エントリ: 3つの重複が見つかりました

サマリー: 2つの警告、1つのエラー
修復を試みるには--fixを指定して実行してください
```

#### 例
```bash
# 基本的な検証
function-indexer validate

# 検証と修正
function-indexer validate --fix --verbose

# 特定のファイルを検証
function-indexer validate --input old-index.jsonl
```

#### AI統合ノート
- **定期メンテナンス**: CIで週次実行
- **移行前チェック**: 主要な更新前に検証
- **エラー回復**: 自動修復には--fixを使用
- **パフォーマンス**: 10万エントリを5秒未満で検証

---

### `repair`

**目的**: 破損または不完全なインデックスファイルを修復  
**カテゴリ**: 管理  
**優先度**: 低  
**AI使用**: エラー回復、メンテナンス

#### 構文
```bash
function-indexer repair [options]
```

#### オプション
- `--input <file>` - 修復するファイル（文字列、デフォルト: 自動検出）
- `--output <file>` - 修復済みファイルの出力（文字列、デフォルト: input.repaired）
- `--strategy <type>` - 修復戦略: safe|aggressive（文字列、デフォルト: safe）

#### 出力フォーマット
```
🔧 インデックスファイルを修復中...

見つかった問題:
- 不正なJSON: 3行
- 必須フィールドの欠落: 5エントリ
- 無効なファイルパス: 2エントリ

修復アクション:
✅ 3つの不正な行を削除
✅ 5つのエントリをデフォルト値で修正
✅ 2つのファイルパスを更新

修復済みファイルを保存: index.jsonl.repaired
```

#### 例
```bash
# 安全な修復（デフォルト）
function-indexer repair

# カスタム出力で積極的な修復
function-indexer repair --strategy aggressive --output fixed-index.jsonl
```

#### AI統合ノート
- **データ損失防止**: セーフモードは疑わしいデータを保持
- **バックアップ優先**: 修復前に常に.backupを作成
- **修復後の検証**: 修復後にvalidateを実行
- **最終手段**: まずvalidate --fixを試す

---

### `backup`

**目的**: インデックスと設定のバックアップを作成  
**カテゴリ**: 管理  
**優先度**: 低  
**AI使用**: データ保護、バージョン管理

#### 構文
```bash
function-indexer backup [options]
```

#### オプション
- `--output <path>` - バックアップ先（文字列、デフォルト: .function-indexer/backups/）
- `--include-metrics` - メトリクスデータベースを含む（ブール値、デフォルト: true）
- `--compress` - 圧縮アーカイブを作成（ブール値、デフォルト: true）

#### 出力フォーマット
```
📦 バックアップを作成中...

含まれるファイル:
✅ 設定: config.json
✅ インデックス: index.jsonl (2.3 MB)
✅ メトリクス: metrics.db (5.1 MB)

バックアップ作成: .function-indexer/backups/backup-2024-01-15-103000.tar.gz
サイズ: 1.8 MB（7.4 MBから圧縮）
```

#### 例
```bash
# デフォルトバックアップ
function-indexer backup

# 特定の場所への非圧縮バックアップ
function-indexer backup --output /backups/project/ --no-compress

# 設定のみ
function-indexer backup --no-include-metrics
```

#### AI統合ノート
- **スケジュールバックアップ**: CIで日次推奨
- **主要変更前**: アップグレード前に常にバックアップ
- **保持ポリシー**: 過去7日分の日次、4週分の週次を保持
- **リストアテスト**: 定期的にリストアプロセスをテスト

---

### `restore`

**目的**: バックアップからリストア  
**カテゴリ**: 管理  
**優先度**: 低  
**AI使用**: 災害復旧、ロールバック操作

#### 構文
```bash
function-indexer restore <backup-file> [options]
```

#### 引数
- `backup-file` - バックアップファイルへのパス（必須）

#### オプション
- `--force` - 既存ファイルを上書き（ブール値、デフォルト: false）
- `--preview` - リストアされる内容を表示（ブール値、デフォルト: false）

#### 出力フォーマット
```
📥 バックアップからリストア中: backup-2024-01-15-103000.tar.gz

バックアップ内容:
- 設定: 2ファイル
- インデックス: 45,231関数
- メトリクス: 30日分の履歴

⚠️  既存のファイルを上書きします。続行しますか？ (y/N)

リストア中...
✅ 設定をリストア
✅ インデックスをリストア
✅ メトリクスデータベースをリストア

リストアが正常に完了しました！
```

#### 例
```bash
# リストアのプレビュー
function-indexer restore backup-2024-01-15.tar.gz --preview

# 強制リストア
function-indexer restore backup-2024-01-15.tar.gz --force

# 特定のパスからリストア
function-indexer restore /backups/emergency-backup.tar.gz
```

#### AI統合ノート
- **検証**: リストア後は常に検証
- **部分的なリストア**: 必要に応じて特定のファイルを抽出
- **ダウングレードパス**: 古いバージョンの互換性をリストア
- **テスト**: リストアプロセスを定期的にテスト

---

### `update-all`

**目的**: マルチプロジェクトワークスペース内のすべてのインデックスを更新  
**カテゴリ**: 管理  
**優先度**: 低  
**AI使用**: モノレポ管理、一括操作

#### 構文
```bash
function-indexer update-all [options]
```

#### オプション
- `--root <path>` - ワークスペースルート（文字列、デフォルト: 現在のディレクトリ）
- `--parallel <number>` - 並列ジョブ（数値、デフォルト: CPU数）
- `--filter <pattern>` - プロジェクトフィルタパターン（文字列）

#### 出力フォーマット
```
🔄 ワークスペース内のすべてのプロジェクトを更新中...

function-indexerを持つ5つのプロジェクトが見つかりました:
1. packages/core
2. packages/auth  
3. packages/api
4. apps/web
5. apps/mobile

更新中...
✅ packages/core: 156関数 (2.1秒)
✅ packages/auth: 89関数 (1.3秒)
✅ packages/api: 234関数 (3.2秒)
✅ apps/web: 445関数 (5.1秒)
✅ apps/mobile: 312関数 (4.2秒)

合計: 1,236関数を15.9秒でインデックス化
```

#### 例
```bash
# すべてのプロジェクトを更新
function-indexer update-all

# 特定のパッケージを更新
function-indexer update-all --filter "packages/*"

# 順次更新
function-indexer update-all --parallel 1
```

#### AI統合ノート
- **モノレポサポート**: 設定ファイルでプロジェクトを検出
- **パフォーマンス**: デフォルトで並列処理
- **部分的な更新**: 特定のパッケージにはフィルタを使用
- **CI最適化**: 変更されていないプロジェクトをキャッシュ

---

## 📊 出力フォーマット仕様

### JSONLインデックス形式

インデックスファイルの各行は以下のスキーマを持つJSONオブジェクト：

```typescript
interface FunctionRecord {
  // ファイル位置
  file: string;              // プロジェクトルートからの相対パス
  
  // 関数識別  
  identifier: string;        // 関数名（または<anonymous>）
  signature: string;         // 型を含む完全な関数シグネチャ
  
  // ファイル内の位置
  startLine: number;         // 開始行番号（1ベース）
  endLine: number;           // 終了行番号（含む）
  
  // 変更追跡
  hash_function: string;     // 関数内容の8文字ハッシュ
  hash_file: string;         // 含まれるファイルの8文字ハッシュ
  
  // 関数の特性
  exported: boolean;         // エクスポート/パブリックか
  async: boolean;            // 非同期関数か
  
  // メトリクスオブジェクト
  metrics: {
    linesOfCode: number;         // 有効行（空白/コメントなし）
    cyclomaticComplexity: number; // 決定ポイント + 1
    cognitiveComplexity: number;  // 理解しやすさスコア
    nestingDepth: number;         // 最大ネストレベル
    parameterCount: number;       // パラメータ数
    hasReturnType: boolean;       // 明示的な戻り値型があるか
  };
  
  // オプションフィールド
  domain?: string;           // ドメイン識別子
  description?: string;      // AI生成の記述
}
```

### エラーレスポンス形式

すべてのコマンドは一貫したエラー報告を使用：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "無効な設定ファイル",
    "details": {
      "file": ".function-indexer/config.json",
      "line": 5,
      "issue": "必須フィールドが見つかりません: 'root'"
    }
  }
}
```

エラーコード：
- `PARSE_ERROR`: TypeScript/TSXファイルの解析に失敗
- `VALIDATION_ERROR`: 無効な設定または入力
- `FILE_NOT_FOUND`: 必須ファイルが見つからない
- `PERMISSION_DENIED`: 権限が不十分
- `INTERNAL_ERROR`: 予期しないエラー

---

## 🤖 AI統合ベストプラクティス

### コマンド選択ガイド

AIアシスタントのコマンド選択：

1. **プロジェクト初期化**: 常に`function-indexer`から開始
2. **発見タスク**: 自然言語で`search`を使用
3. **品質チェック**: 変更を提案する前に`metrics`を実行
4. **変更追跡**: 影響分析に`diff`を使用
5. **CI/CD統合**: 適切な形式で`ci`を実装

### 出力処理のヒント

1. **JSONL解析**: メモリ効率のために行ごとに処理
2. **スコア閾値**: 
   - 検索: 意味のある結果には関連性 > 0.5
   - メトリクス: 違反を最初に焦点
3. **エラー処理**: 特定の回復のためにerror.codeを確認
4. **インクリメンタル処理**: 変更を検出するためにハッシュを使用

### パフォーマンス考慮事項

| 操作 | スケール | 予想時間 |
|------|----------|----------|
| インデックス化 | 1,000ファイル | 約1秒 |
| 検索 | 100,000関数 | <100ms |
| メトリクス | 10,000関数 | 約500ms |
| 差分 | 50,000関数 | 約1秒 |

### 一般的なワークフロー

```bash
# 1. 初期プロジェクト分析
function-indexer
function-indexer metrics
function-indexer list --exported --format json

# 2. 特定の機能を見つける  
function-indexer search "ユーザー認証"
function-indexer search "検証" --context "メール"

# 3. PR品質チェック
function-indexer diff main HEAD
function-indexer metrics --details
function-indexer ci --fail-on-violation

# 4. 定期メンテナンス
function-indexer validate
function-indexer backup
function-indexer analyze-trends
```

---

## 📚 追加リソース

- **設定ガイド**: `.function-indexer/config.json`スキーマ
- **APIドキュメント**: Node.jsを介したプログラマティック使用
- **GitHub統合**: アクションとワークフロー
- **トラブルシューティング**: 一般的な問題と解決策

AIアシスタント向け：このリファレンスはマシン解析用に最適化されています。各コマンドセクションは、信頼性の高い情報抽出のために一貫した構造に従っています。