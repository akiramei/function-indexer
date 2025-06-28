# 🤖 Function Indexer - AI統合ガイド

**包括的AIアシスタントリファレンス** | **バージョン 1.1**

## エグゼクティブサマリー

Function Indexerは、AI支援によるコード品質管理のために設計されたプロフェッショナルなTypeScript CLIツールです。コードベースをスキャンし、品質メトリクスを含む構造化された関数メタデータを抽出し、開発追跡と自動品質ゲートのための包括的なツールを提供します。

**主要な価値提案**：
- **ゼロ設定での起動** - デフォルト設定ですぐに動作
- **AI最適化された出力** - AI処理に適したJSONL形式
- **フェーズベースの品質管理** - 開発フェーズ全体での品質変化を追跡
- **エンタープライズ対応** - CI/CD統合、カスタムしきい値、包括的なレポート

## AIアシスタント向けクイックスタート

「Function Indexerを使用してコード品質を管理する」よう求められた場合、以下の手順に従ってください：

1. **初期スキャンを実行**してベースラインを確立
2. **定期的にメトリクスを更新**して変更を追跡
3. **品質レポートを確認**して違反をチェック
4. **CI/CD統合を設定**して自動チェック
5. **定期レポートを作成**してコードレビュー

### 前提条件
```bash
# Linux/WSLユーザーのみ
sudo apt update && sudo apt install build-essential python3
```

### 即座に使用
```bash
# プロジェクト初期化と関数インデックス作成（初回）
npx github:akiramei/function-indexer

# コード変更後のメトリクス更新（推奨）
npx github:akiramei/function-indexer         # インデックスとメトリクスの両方を更新
fx                                           # 上記の短縮エイリアス

# 品質概要を確認
npx github:akiramei/function-indexer metrics trends
fx metrics trends

# 関数を検索
npx github:akiramei/function-indexer search "authentication" --context "login"
fx s "authentication"
```

## コア機能

- **関数検出**: TypeScript/TSXファイル内のすべての関数を検出
- **メトリクス分析**: 複雑度、コード行数、ネストの深さを計算
- **検索**: 自然言語とパターンベースの関数検索
- **変更追跡**: コンテンツハッシングによる変更検出
- **品質監視**: 時間経過によるコード品質トレンドの追跡

## アーキテクチャ理解

### データフロー
```
TypeScript/TSXファイル → AST解析 → 関数抽出 → メトリクス計算 → JSONL出力
                                                        ↓
                                                 SQLiteデータベース（トレンド用）
```

### 主要コンポーネント
- **インデクサーエンジン**: 正確な関数抽出のためのts-morphベースのAST解析
- **メトリクスエンジン**: 設定可能なしきい値を持つ6つの主要コード品質メトリクスを計算
- **設定システム**: モジュール性のためのコアとメトリクスの分離された設定

## インストールオプション

### オプション1: 直接npx使用（推奨）
```bash
# npxで直接実行（インストール不要）
npx github:akiramei/function-indexer

# 特定のディレクトリをスキャンして出力ファイルを指定
npx github:akiramei/function-indexer --root ./src --output functions.jsonl

# PRのメトリクスを収集（新しいコマンド構造）
npx github:akiramei/function-indexer metrics collect --root ./src --pr 123
```

### オプション2: ローカルプロジェクトインストール
```bash
# プロジェクトにローカルインストール
npm install --save-dev github:akiramei/function-indexer
npx function-indexer

# 代替：npmパッケージ（公開されている場合）
npm install --save-dev @akiramei/function-indexer
npx function-indexer
```

## コマンドリファレンス

### 1. コアインデックスコマンド

#### メイン関数インデックス生成
```bash
npx github:akiramei/function-indexer --root <path> --output <file> [options]

# 例：
npx github:akiramei/function-indexer --root ./src --output functions.jsonl
npx github:akiramei/function-indexer --root ./lib --domain backend --verbose
```

**オプション**：
- `--root <path>`: スキャンするソースディレクトリ（デフォルト：現在のディレクトリ）
- `--output <file>`: 出力JSONLファイル（デフォルト：function-index.jsonl）
- `--domain <name>`: オプションのドメイン分類
- `--include <patterns>`: 含めるファイルパターン（デフォルト：**/*.ts, **/*.tsx）
- `--exclude <patterns>`: 除外するファイルパターン（デフォルト：テストファイル）
- `--verbose`: 詳細ログを有効化

#### 簡略化されたコマンド（v1.1.0+）

**注意**: `fx`エイリアスを使用するには、以下のいずれかの方法でFunction Indexerをインストールしてください：
```bash
# グローバルインストール（推奨）
npm install -g github:akiramei/function-indexer

# または、プロジェクトにローカルインストール後にPATHを追加
npm install --save-dev github:akiramei/function-indexer
npx function-indexer install-alias  # エイリアスを設定
```

```bash
# 関数インデックスを初期化または更新
fx                              # function-indexerの短縮エイリアス

# 自然言語で関数を検索
fx s "認証ロジック"             # searchの短縮エイリアス
fx search "ユーザー検証" --context "auth"

# フィルタ付きですべての関数をリスト
fx ls                          # listの短縮エイリアス
fx list --file "src/auth.ts" --complexity ">10"

# メトリクス概要を表示
fx m                           # metricsの短縮エイリアス
fx metrics                     # コード品質概要を表示
```

### 2. メトリクスコマンド

Function Indexerは、時間経過によるコード品質追跡のための包括的なメトリクスシステムを含みます：

#### メトリクス更新/初期化
```bash
# 推奨: メインコマンドでメトリクス更新（初期設定と更新の両方を処理）
fx                                    # 関数インデックスとメトリクスを自動更新
npx github:akiramei/function-indexer  # 上記と同じ、両方を更新

# 代替手段: 手動メトリクス更新
fx metrics collect --root ./src       # メトリクスデータベースのみを更新
```

#### 概要コマンド
```bash
# コード品質概要を表示
npx github:akiramei/function-indexer metrics
fx metrics

# 詳細なトレンドと違反を表示
npx github:akiramei/function-indexer metrics trends
fx metrics trends
```

#### 収集コマンド（高度な使用法）
```bash
# 特定の追跡のためのメトリクス収集（高度な使用法）
npx github:akiramei/function-indexer metrics collect --root ./src --pr 123 --verbose
fx metrics collect --root ./src --pr 123 --verbose

# 注意: 通常の更新には、代わりに 'fx' コマンドを使用してください
```

#### 分析コマンド
```bash
# 関数の履歴とトレンドを表示
npx github:akiramei/function-indexer metrics show "src/indexer.ts:FunctionIndexer.run"
fx metrics show "src/indexer.ts:FunctionIndexer.run" --limit 5

# PR固有のメトリクスを表示
npx github:akiramei/function-indexer metrics pr 123
fx metrics pr 123
```

### 3. 検索と発見コマンド

```bash
# 自然言語検索
npx github:akiramei/function-indexer search "認証ロジック"
fx s "ユーザー検証"

# パターンベース検索
npx github:akiramei/function-indexer search --pattern "handle*Error"
fx search --pattern "validate*" --async-only

# フィルタ付きで関数をリスト
npx github:akiramei/function-indexer list --file "src/auth.ts"
fx ls --complexity ">10" --exported-only
```

## 品質メトリクスシステム

### サポートされるメトリクス
1. **循環的複雑度**（しきい値：10）- コード内の決定ポイントを測定
2. **認知的複雑度**（しきい値：15）- コードの理解の難しさを測定
3. **コード行数**（しきい値：50）- 中括弧/コメントを除く有効な行数をカウント
4. **ネストの深さ**（しきい値：4）- 制御構造の最大深度
5. **パラメータ数**（しきい値：4）- 関数パラメータの数
6. **戻り値型注釈** - 関数に明示的な戻り値型があるかどうか

### 違反検出
システムはしきい値を超える関数を自動的にフラグ付けします：
```bash
# すべての違反を表示
fx metrics trends

# 出力例：
# ⚠️  高複雑度: src/parser.ts:parseExpression (複雑度: 12, しきい値: 10)
# ⚠️  長い関数: src/indexer.ts:processFile (行数: 55, しきい値: 50)
```

## 出力形式の理解

### JSONL構造
出力の各行には完全な関数レコードが含まれます：

```typescript
interface FunctionRecord {
  file: string;          // 相対ファイルパス
  identifier: string;    // 関数名
  signature: string;     // 完全な関数シグネチャ
  startLine: number;     // 開始行番号
  endLine: number;       // 終了行番号
  hash_function: string; // コンテンツハッシュ（8文字）
  hash_file: string;     // ファイルハッシュ（8文字）
  exported: boolean;     // エクスポートされているか
  async: boolean;        // 非同期関数か
  metrics: {
    linesOfCode: number;
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    nestingDepth: number;
    parameterCount: number;
    hasReturnType: boolean;
  };
  domain: string;        // ユーザー指定のドメイン（オプション）
}
```

### 出力例
```json
{"file":"src/indexer.ts","identifier":"FunctionIndexer.run","signature":"async run(): Promise<void>","startLine":45,"endLine":78,"hash_function":"a1b2c3d4","hash_file":"e5f6g7h8","exported":true,"async":true,"metrics":{"linesOfCode":28,"cyclomaticComplexity":6,"cognitiveComplexity":8,"nestingDepth":2,"parameterCount":0,"hasReturnType":true},"domain":"main"}
```

## AIワークフローパターン

### 1. コード発見と分析
```bash
# ステップ1：包括的な関数インデックスを生成
fx --root ./src --output analysis.jsonl

# ステップ2：特定の機能を検索
fx s "エラー処理" --context "検証"

# ステップ3：品質メトリクスを分析
fx metrics trends
```

### 2. 品質評価
```bash
# ステップ1：メトリクス更新（推奨アプローチ）
fx                                        # 関数インデックスとメトリクスを更新

# ステップ2：違反を特定
fx metrics trends

# ステップ3：特定の関数を分析
fx metrics show "src/problematic.ts:complexFunction"
```

### 3. 変更追跡
```bash
# ステップ1：ベースライン収集（変更前）
fx                                        # 現在のベースラインを確立

# ステップ2：コード変更を実施
# ... 開発作業 ...

# ステップ3：変更後のメトリクス更新
fx                                        # 新しい変更でメトリクスを更新
fx metrics trends                         # 変更内容を表示

# オプション：特定のPRを追跡
fx metrics collect --root ./src --pr 123  # 高度なPR追跡
fx metrics pr 123                         # PR固有の変更を表示
```

### 4. PRレビュー自動化
```bash
# レビュー前の準備
fx                                        # 現在のメトリクスを更新
fx metrics collect --root ./src --pr 456  # オプション：特定のPRを追跡

# レビューインサイトを生成
fx metrics trends                         # 現在の違反を表示
fx metrics pr 456                         # PR固有の変更を表示（追跡されている場合）

# 品質違反に焦点を当てる
fx metrics trends                         # すべての現在の問題を特定
```

## 設定システム

Function Indexerはモジュール性のために分離された設定システムを使用します：

### コア設定（`.function-indexer/config.json`）
```json
{
  "version": "1.1.0",
  "root": "./src",
  "output": "function-index.jsonl",
  "domain": "main",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

### メトリクス設定（`.function-indexer/metrics-config.json`）
```json
{
  "version": "1.1.0",
  "enabled": true,
  "thresholds": {
    "cyclomaticComplexity": 10,
    "cognitiveComplexity": 15,
    "linesOfCode": 50,
    "nestingDepth": 4,
    "parameterCount": 4
  },
  "database": {
    "path": ".function-metrics/metrics.db",
    "autoCleanup": false,
    "maxHistoryDays": 365
  }
}
```

## 高度な統合パターン

### 1. カスタムワークフロー統合
```bash
#!/bin/bash
# quality-check.sh - カスタム品質ゲートスクリプト

echo "🔍 コードベースをスキャン中..."
fx --root ./src --output current-functions.jsonl

echo "📊 メトリクスを収集中..."
fx metrics collect --root ./src --pr $PR_NUMBER

echo "⚠️  違反をチェック中..."
fx metrics trends --format json > violations.json

if [ -s violations.json ]; then
    echo "❌ 品質ゲート失敗 - 違反が検出されました"
    exit 1
else
    echo "✅ 品質ゲート合格"
    exit 0
fi
```

### 2. CI/CDパイプライン統合
```yaml
# GitHub Actions例
name: コード品質チェック
on: [pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Function Indexerをインストール
        run: npm install -g github:akiramei/function-indexer
      
      - name: メトリクスを収集
        run: fx metrics collect --root ./src --pr ${{ github.event.number }}
      
      - name: 品質ゲートをチェック
        run: fx metrics trends --fail-on-violations
```

### 3. 高度な使用例のためのAPI統合
```typescript
// プログラム的な使用（必要な場合）
import { FunctionIndexer } from 'function-indexer';

const indexer = new FunctionIndexer({
  root: './src',
  include: ['**/*.ts', '**/*.tsx'],
  exclude: ['**/*.test.ts']
});

const results = await indexer.run();
console.log(`${results.length}個の関数が見つかりました`);
```

## よくある問題のトラブルシューティング

### 1. インストールの問題
```bash
# Linux/WSL：ビルドツールが不足
sudo apt update && sudo apt install build-essential python3

# Node.jsバージョンの互換性
node --version  # >= 18.0.0である必要があります
```

### 2. 解析エラー
```bash
# 詳細を見るために詳細ログを有効化
fx --verbose --root ./src

# TypeScript設定を確認
npx tsc --noEmit  # プロジェクトがコンパイルされることを確認
```

### 3. パフォーマンスの問題
```bash
# 不要なファイルを除外
fx --root ./src --exclude "**/*.test.ts" --exclude "**/node_modules/**"

# より小さなディレクトリを処理
fx --root ./src/core --output core-functions.jsonl
```

## AIアシスタントのベストプラクティス

### 1. 段階的分析
- 概要には`fx metrics`から開始
- ターゲット発見には`fx s "topic"`を使用
- `fx metrics show "specific-function"`で詳細を確認

### 2. 品質重視のワークフロー
- 大きな変更前に常にメトリクスを収集
- 変更の影響にはPRベースの追跡を使用
- 違反に最初に焦点を当て、次により広いパターンに移行

### 3. 効率的な統合
- 速度のために簡略化された`fx`コマンドを使用
- 一貫性のために設定ファイルを活用
- CI/CDパイプラインに品質ゲートを実装

### 4. データ処理
- 大規模なコードベースではJSONL出力を行ごとに解析
- 変更検出にはハッシュフィールドを使用
- 包括的な分析のために他のツールと組み合わせる

## レガシーコマンドサポート

以下のレガシーコマンドは引き続きサポートされていますが、非推奨です：

```bash
# レガシー（まだ動作しますが、新しい構造を使用してください）
function-indexer collect-metrics --root ./src --pr 123
function-indexer show-metrics "src/file.ts:function"
function-indexer analyze-trends
function-indexer pr-metrics 123

# 新しい推奨構造
fx metrics collect --root ./src --pr 123
fx metrics show "src/file.ts:function"
fx metrics trends
fx metrics pr 123
```

## まとめ

Function IndexerはAIアシスタントにコード品質管理のための包括的なツールを提供します：

1. **発見**: 大規模なコードベース全体で関数を見つけて理解
2. **分析**: 品質メトリクスを追跡し、改善の機会を特定
3. **監視**: 時間経過と開発フェーズ全体での品質トレンドを観察
4. **統合**: 既存の開発ワークフローにシームレスに組み込む

このツールは、高度な使用例のための広範なカスタマイズオプションを提供しながら、ゼロ設定ですぐに動作するように設計されています。