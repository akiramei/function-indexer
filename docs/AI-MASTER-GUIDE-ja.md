# 🤖 Function Indexer - AI マスターガイド

**バージョン 1.0** | **包括的AIアシスタント向けリファレンス**

## エグゼクティブサマリー

Function Indexerは、AI支援コード品質管理のために設計されたプロフェッショナルなTypeScript CLIツールです。コードベースをスキャンし、品質メトリクス付きの構造化された関数メタデータを抽出し、フェーズベース開発追跡と自動品質ゲートのための包括的なツールを提供します。

**主要価値提案**:
- **ゼロ設定スタートアップ** - 合理的なデフォルトで即座に動作
- **フェーズベース品質管理** - 開発フェーズ間での品質変化を追跡
- **AI最適化出力** - 簡単なAI処理のためのJSONL形式
- **エンタープライズ対応** - CI/CD統合、カスタム閾値、包括的レポート

## クイックスタートガイド

### 前提条件
```bash
# Linux/WSLユーザーのみ
sudo apt update && sudo apt install build-essential python3
```

### 即座に使用開始
```bash
# 現在のプロジェクトをスキャン（ゼロ設定）
npx @akiramei/function-indexer

# 特定ディレクトリを出力付きでスキャン
npx @akiramei/function-indexer --root ./src --output functions.jsonl

# 品質概要
npx @akiramei/function-indexer metrics --details

# 関数検索
npx @akiramei/function-indexer search "認証" --context "ログイン"
```

## コアアーキテクチャの理解

### データフロー
```
TypeScript/TSXファイル → AST分析 → 関数抽出 → メトリクス計算 → JSONL出力
                                                        ↓
                                                 SQLiteデータベース（トレンド用）
```

### 主要コンポーネント
- **インデクサーエンジン**: 正確な関数抽出のためのts-morphベースAST解析
- **メトリクスエンジン**: 設定可能な閾値を持つ6つの主要コード品質メトリクスを計算
- **設定システム**: モジュラリティのための分離されたコアおよびメトリクス設定
- **データベースシステム**: 履歴追跡とトレンド分析のためのSQLite
- **レポートシステム**: 複数の出力形式（ターミナル、markdown、HTML、JSON）

### 設定アーキテクチャ（新機能: v1.1.0）
Function Indexerは**分離された設定システム**を使用します：

```
.function-indexer/
├── config.json          # コア設定（インデクシング、ファイルパターン）
└── metrics-config.json  # メトリクス設定（閾値、追跡）
```

**利点**: モジュラー設定、独立した更新、パフォーマンス最適化、保守性の向上。

## 関数レコードスキーマ

各関数は包括的なレコードとして表現されます：

```typescript
interface FunctionRecord {
  file: string;          // 相対ファイルパス
  identifier: string;    // 関数名（メソッドの場合はclass.method）
  signature: string;     // 完全な関数シグネチャ
  startLine: number;     // 開始行番号
  endLine: number;       // 終了行番号
  hash_function: string; // 変更検出用コンテンツハッシュ（8文字）
  hash_file: string;     // ファイルレベル追跡用ファイルハッシュ（8文字）
  exported: boolean;     // エクスポート状態
  async: boolean;        // 非同期関数インジケータ
  metrics: {
    linesOfCode: number;           // 実効行数（ブレース/コメント除く）
    cyclomaticComplexity: number;  // 決定ポイント（if/for/while/case）
    cognitiveComplexity: number;   // 人間の理解困難度
    nestingDepth: number;          // 最大ネストレベル
    parameterCount: number;        // 関数パラメータ数
    hasReturnType: boolean;        // TypeScript戻り値型アノテーション
  };
  domain: string;        // オプションのドメイン分類
}
```

## AIアシスタント向けコマンドリファレンス

### 1. インデックス生成（コアコマンド）
```bash
npx @akiramei/function-indexer [options]
```
**目的**: JSONL形式での包括的関数インデックス生成
**AI使用ケース**: コードベース分析、関数発見、変更追跡
**オプション**:
- `--root, -r`: スキャンディレクトリ（省略時は自動検出）
- `--output, -o`: 出力ファイルパス（省略時は自動生成）
- `--domain`: 関数分類のための論理ドメイン
- `--verbose, -v`: 詳細進捗出力

### 2. 関数検索
```bash
npx @akiramei/function-indexer search <query> [options]
```
**目的**: 自然言語およびパターンベースの関数発見
**AI使用ケース**: コード探索、類似関数検索、機能位置特定
**高度な例**:
```bash
# マルチコンテキスト検索
npx @akiramei/function-indexer search "検証" --context "ユーザー入力セキュリティ"

# パターンベース検索
npx @akiramei/function-indexer search "handle*Error" --limit 20

# 複雑な機能検索
npx @akiramei/function-indexer search "データベース操作" --context "非同期トランザクション"
```

### 3. 品質分析
```bash
npx @akiramei/function-indexer metrics [--details]
```
**目的**: コード品質概要と違反検出
**AI使用ケース**: 品質評価、リファクタリング優先順位付け、技術的負債特定

**出力解釈**:
- 閾値を超えた関数は即座の注意が必要
- 平均複雑度トレンドは全体的なコード健全性を示す
- 分布パターンはアーキテクチャ品質を明らかにする

### 4. 履歴追跡
```bash
# PR関連付けでメトリクス収集
npx @akiramei/function-indexer collect-metrics --root ./src --pr 123 --verbose

# 関数の進化表示
npx @akiramei/function-indexer show-metrics "src/auth.ts:validateToken" --limit 10

# トレンド分析
npx @akiramei/function-indexer analyze-trends
```

### 5. 比較分析
```bash
# ブランチ/コミット比較
npx @akiramei/function-indexer diff main feature-branch --format markdown --output changes.md

# フェーズ比較（タグ使用）
npx @akiramei/function-indexer diff phase-1-complete phase-2-complete --format json
```

### 6. レポートと文書化
```bash
# エグゼクティブHTMLダッシュボード
npx @akiramei/function-indexer report --format html --output quality-dashboard.html

# 技術的markdownレポート
npx @akiramei/function-indexer report --format markdown --output technical-analysis.md

# 外部ツール向けデータエクスポート
npx @akiramei/function-indexer report --format json --output metrics-export.json
```

### 7. CI/CD統合
```bash
# GitHub Actions統合
npx @akiramei/function-indexer ci --format github --base main --fail-on-violation

# カスタム品質ゲート
npx @akiramei/function-indexer ci --thresholds '{"cyclomaticComplexity":8}' --fail-on-violation
```

## 品質メトリクス詳細

### メトリクス定義と閾値

| メトリクス | 説明 | 良好 | 警告 | 危険 | AI解釈 |
|-----------|------|------|------|------|--------|
| **循環的複雑度** | 決定ポイント（if/for/while/case） | ≤5 | 6-10 | >10 | コードを通る線形パス |
| **認知的複雑度** | 人間の理解困難度 | ≤8 | 9-15 | >15 | 理解するための精神的負荷 |
| **コード行数** | 実効行数（ブレース除く） | ≤20 | 21-40 | >40 | 関数サイズ指標 |
| **ネスト深度** | 最大ネストレベル | ≤2 | 3 | >3 | コード構造複雑度 |
| **パラメータ数** | 関数パラメータ数 | ≤3 | 4 | >4 | インターフェース複雑度 |
| **戻り値型** | TypeScript戻り値アノテーション | 存在 | - | 欠如 | 型安全性指標 |

### カスタム閾値設定
```json
{
  "thresholds": {
    "cyclomaticComplexity": 8,     // エンタープライズ: より厳格
    "cognitiveComplexity": 12,     // エンタープライズ: より厳格  
    "linesOfCode": 30,             // 中程度の関数
    "nestingDepth": 3,             // 一部のネストを許可
    "parameterCount": 3            // クリーンなインターフェース
  }
}
```

## AIワークフローパターン

### パターン1: コードベース理解と分析
```bash
# ステップ1: 概要取得
npx @akiramei/function-indexer metrics

# ステップ2: 複雑な領域を発見
npx @akiramei/function-indexer metrics --details

# ステップ3: 特定ドメインを探索
npx @akiramei/function-indexer search "認証" --context "セキュリティパターン"

# ステップ4: エントリポイント特定
npx @akiramei/function-indexer search "main" --context "アプリケーションエントリ"
```

**AIアシスタント応答パターン**:
1. 全体的な品質メトリクスを要約
2. 閾値を超えた関数をハイライト
3. アーキテクチャパターンを特定
4. 探索パスを提案

### パターン2: コードレビューと品質ゲート
```bash
# ステップ1: ベースライン生成
npx @akiramei/function-indexer --root ./src

# ステップ2: 変更比較
npx @akiramei/function-indexer diff main HEAD --format markdown

# ステップ3: 品質評価
npx @akiramei/function-indexer ci --base main --format github

# ステップ4: メトリクス収集
npx @akiramei/function-indexer collect-metrics --pr $PR_NUMBER
```

**AIアシスタント応答パターン**:
1. 新規/変更された関数を特定
2. 品質への影響を評価
3. 違反とリスクをフラグ
4. 具体的な改善推奨事項を提供

### パターン3: リファクタリング計画
```bash
# ステップ1: リファクタリング候補を発見
npx @akiramei/function-indexer metrics --details

# ステップ2: 複雑度分布を分析
npx @akiramei/function-indexer report --format json | jq '.functions[] | select(.metrics.cyclomaticComplexity > 10)'

# ステップ3: 類似パターンを発見
npx @akiramei/function-indexer search "類似機能パターン"

# ステップ4: 改善を追跡
npx @akiramei/function-indexer show-metrics "対象関数" --limit 10
```

### パターン4: フェーズベース品質管理
```bash
# フェーズベースライン確立
git tag phase-1-baseline
npx @akiramei/function-indexer collect-metrics --root ./src
npx @akiramei/function-indexer report --format html --output phase1-quality.html

# フェーズ比較と分析
git tag phase-2-complete
npx @akiramei/function-indexer diff phase-1-baseline phase-2-complete --format markdown --output phase-comparison.md
npx @akiramei/function-indexer analyze-trends
```

## 高度なAI統合シナリオ

### シナリオ1: 技術的負債評価
```bash
# 包括的負債分析
npx @akiramei/function-indexer report --format json --output debt-analysis.json
npx @akiramei/function-indexer analyze-trends

# AI処理:
# - 高複雑度関数のJSONを解析
# - 技術的負債スコアを計算
# - ビジネスインパクトに基づくリファクタリング優先順位付け
# - 改善ロードマップを生成
```

### シナリオ2: コード品質監視
```bash
# 継続的品質追跡
npx @akiramei/function-indexer collect-metrics --root ./src --pr $PR_NUMBER
npx @akiramei/function-indexer show-metrics --list | grep "violation"

# AI処理:
# - 時間経過に伴う品質トレンドを追跡
# - 劣化パターンを特定
# - 閾値違反時にアラート
# - 予防措置を提案
```

### シナリオ3: アーキテクチャ分析
```bash
# ドメインベース分析
npx @akiramei/function-indexer --root ./src --domain "認証"
npx @akiramei/function-indexer search "*" --context "アーキテクチャパターン"

# AI処理:
# - アーキテクチャ境界を特定
# - コンポーネント間の結合を分析
# - アーキテクチャ改善を提案
# - 設計原則の遵守を検証
```

## 設定管理

### コア設定（`.function-indexer/config.json`）
```json
{
  "version": "1.1.0",
  "root": "./src",
  "output": "function-index.jsonl",
  "domain": "main",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "node_modules/**"]
}
```

### メトリクス設定（`.function-indexer/metrics-config.json`）
```json
{
  "version": "1.1.0",
  "enabled": true,
  "database": {
    "path": ".function-metrics/metrics.db",
    "autoCleanup": false,
    "maxHistoryDays": 365
  },
  "thresholds": {
    "cyclomaticComplexity": 10,
    "cognitiveComplexity": 15,
    "linesOfCode": 50,
    "nestingDepth": 4,
    "parameterCount": 4
  },
  "collection": {
    "autoCollectOnCommit": false,
    "includeUncommitted": true,
    "trackTrends": true
  },
  "reporting": {
    "defaultFormat": "summary",
    "showTrends": true,
    "highlightViolations": true
  }
}
```

### マイグレーションと後方互換性
- **自動マイグレーション** - レガシー単一設定形式から
- **マイグレーション中のバックアップ作成**
- **100%後方互換性** を維持
- **透明な操作** - ユーザー介入不要

## AIシステム向け出力処理

### JSONL処理パターン
```javascript
// 関数データ処理のNode.js例
const fs = require('fs');
const readline = require('readline');

async function processIndex(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream });
  
  const functions = [];
  for await (const line of rl) {
    const func = JSON.parse(line);
    functions.push(func);
  }
  
  return functions;
}

// 高複雑度関数をフィルタ
const complexFunctions = functions.filter(f => 
  f.metrics.cyclomaticComplexity > 10 || 
  f.metrics.cognitiveComplexity > 15
);

// アーキテクチャ分析のためにファイル別にグループ化
const byFile = functions.reduce((acc, func) => {
  if (!acc[func.file]) {
    acc[func.file] = [];
  }
  acc[func.file].push(func);
  return acc;
}, {} as Record<string, any[]>);
```

### Python統合例
```python
import json
import pandas as pd

def analyze_functions(jsonl_path):
    functions = []
    with open(jsonl_path, 'r') as f:
        for line in f:
            functions.append(json.loads(line))
    
    df = pd.DataFrame(functions)
    
    # 品質分析
    high_complexity = df[df['metrics.cyclomaticComplexity'] > 10]
    
    # アーキテクチャ洞察
    files_by_complexity = df.groupby('file')['metrics.cyclomaticComplexity'].mean()
    
    return {
        'total_functions': len(df),
        'high_complexity_count': len(high_complexity),
        'average_complexity': df['metrics.cyclomaticComplexity'].mean(),
        'files_by_complexity': files_by_complexity.to_dict()
    }
```

## CI/CD統合パターン

### GitHub Actions統合
```yaml
name: コード品質分析
on: [push, pull_request]

jobs:
  quality-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # diff分析に必要
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: システム依存関係のインストール
        run: sudo apt update && sudo apt install build-essential python3
      
      - name: コード品質分析
        run: |
          npx @akiramei/function-indexer collect-metrics --root ./src --pr ${{ github.event.number }}
          npx @akiramei/function-indexer ci --format github --base main --fail-on-violation
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GitLab CI統合
```yaml
code-quality:
  stage: test
  image: node:18
  before_script:
    - apt-get update && apt-get install -y build-essential python3
  script:
    - npx @akiramei/function-indexer collect-metrics --root ./src --pr $CI_MERGE_REQUEST_IID
    - npx @akiramei/function-indexer ci --format gitlab --comment --base main
  artifacts:
    reports:
      junit: quality-report.xml
```

## トラブルシューティングと一般的な問題

### パフォーマンス最適化
- **大規模コードベース**: `--exclude`パターンを使用して不要なファイルをスキップ
- **メモリ問題**: ディレクトリをより小さなチャンクで処理
- **遅い分析**: テストファイルとnode_modulesを除外

### エラー解決
- **解析エラー**: ソースファイルのTypeScript構文エラーを確認
- **関数が見つからない**: `--include`パターンがファイル構造と一致するか確認
- **データベースロック**: メトリクスデータベースにアクセスするプロセスが1つだけであることを確認

### ベストプラクティス
1. **常に最初にメインコマンドを実行** して新鮮なインデックスデータを生成
2. **特定の`--root`パスを使用** して分析範囲を制限
3. **JSONL出力を保存** して後処理と分析に使用
4. **プロジェクト要件に基づいてカスタム閾値を設定**
5. **自動品質ゲートのためにCI/CDと統合**

## AIアシスタント向けエキスパートTips

### 効果的な分析パターン
1. **詳細に入る前に概要から開始**（`metrics`）
2. **戦略的に検索を使用** - より良い結果のために特定のコンテキストを使用
3. **diffコマンドを活用** して時間経過に伴う変化を理解
4. **複数のメトリクスを組み合わせ** て包括的な品質評価を行う
5. **データをエクスポート**（`--format json`）して高度な分析を行う

### 応答テンプレート
Function Indexerでユーザーを支援する際：

**品質評価の場合**:
1. メトリクス概要を実行
2. 閾値違反を特定
3. 具体的な改善を提案
4. 実装ガイダンスを提供

**アーキテクチャ分析の場合**:
1. 包括的インデックスを生成
2. 複雑度分布を分析
3. 結合パターンを特定
4. アーキテクチャ改善を提案

**リファクタリング計画の場合**:
1. 高複雑度関数を発見
2. 変更履歴を分析
3. 類似パターンを特定
4. 改善を優先順位付け

## バージョン履歴と更新

**v1.1.0**（現在）
- 分離された設定システム（コア + メトリクス設定）
- PR追跡機能付き拡張メトリクス収集
- 改善されたCI/CD統合
- より良いエラーハンドリングとパフォーマンス

**v1.0.0**
- 初期包括的実装
- SQLiteストレージ付き完全メトリクススイート
- マルチフォーマットレポート（ターミナル、markdown、HTML、JSON）
- 自然言語サポート付き検索機能

---

*このAI マスターガイドは、Function Indexerを使用するAIアシスタントの決定版リファレンスです。技術実装の詳細については、CLAUDE.mdを参照してください。ユーザー向けドキュメントについては、README.mdを参照してください。*