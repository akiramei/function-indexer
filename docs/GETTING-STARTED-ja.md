# 🚀 Function Indexerを始める

## 🌐 Language Selection / 言語選択

[English](GETTING-STARTED.md) | **日本語**（ここ）

> **ゼロから実用まで完全ガイド** - 60秒で起動、5分で基本をマスター

## 📖 学習内容

この段階的ガイドでは、必要なすべてをカバーします：

1. [**⚡ クイックスタート（60秒）**](#-クイックスタート60秒) - すぐに実行
2. [**📊 結果の理解**](#-結果の理解) - 出力を理解する
3. [**🔧 基本コマンド**](#-基本コマンド) - 必要なコアコマンド
4. [**🎯 ディープダイブ（30分）**](#-ディープダイブプロジェクト統合) - 高度な使用と統合
5. [**🚀 マスタリーとベストプラクティス**](#-マスタリーとベストプラクティス) - プロフェッショナルワークフロー

---

## ⚡ クイックスタート（60秒）

### 前提条件
```bash
# Linux/WSLユーザーのみ（macOS/Windowsの場合はスキップ）
sudo apt update && sudo apt install build-essential python3
```

### プロジェクトタイプを選択

<details>
<summary>🟦 <strong>TypeScript/Node.jsプロジェクト</strong></summary>

#### インストールと初回実行
```bash
# プロジェクトに移動して直接実行
cd your-typescript-project
npx github:akiramei/function-indexer
```

#### 表示される内容
```
🚀 Function Indexerへようこそ！
✨ TypeScriptプロジェクトを検出: /your/project
✅ 設定を.function-indexer/に作成
📁 スキャン中: src/
✅ インデックス作成完了！

📊 結果:
   • 関数発見数: 47
   • 処理ファイル数: 12
   • 出力: function-index.jsonl

🎯 次に試すクイックコマンド:
   fx s "auth"        # 認証関数を検索
   fx m               # コード品質メトリクスを表示
   fx ls --exported   # エクスポートされた関数のみリスト
```

#### 次のステップ
```bash
# 関数を検索
fx s "認証"

# コード品質をチェック
fx m

# 利用可能なすべてのコマンドを表示
fx --help
```

</details>

<details>
<summary>🟧 <strong>Reactプロジェクト</strong></summary>

#### インストールと初回実行
```bash
# 前提条件（Linux/WSLユーザー）
sudo apt update && sudo apt install build-essential python3

# Reactプロジェクトに移動
cd your-react-app
npx github:akiramei/function-indexer --root ./src
```

#### 表示される内容
```
🚀 Function Indexerへようこそ！
✨ Reactプロジェクトを検出: /your/react-app
📁 スキャン中: src/
✅ コンポーネント、フック、ユーティリティを発見

📊 結果:
   • 関数発見数: 23 (12コンポーネント、8フック、3ユーティリティ)
   • 処理ファイル数: 8
   • 出力: function-index.jsonl

🎯 React固有の検索を試す:
   fx s "component"   # Reactコンポーネントを検索
   fx s "hook"        # カスタムフックを検索
   fx s "handler"     # イベントハンドラーを検索
```

#### 次のステップ
```bash
# Reactパターンを検索
fx s "useState"
fx s "useEffect"
fx s "onClick"

# コンポーネントの複雑度をチェック
fx m
```

</details>

<details>
<summary>🟪 <strong>大規模コードベース/モノレポ</strong></summary>

#### インストールと初回実行
```bash
# 前提条件（Linux/WSLユーザー）
sudo apt update && sudo apt install build-essential python3

# 大規模コードベースの場合、ルートディレクトリを指定
cd your-monorepo
npx github:akiramei/function-indexer --root ./packages/core --output core-functions.jsonl
```

#### 表示される内容
```
🚀 Function Indexerへようこそ！
📁 スキャン中: packages/core/
⏳ 大規模コードベースを処理中...（少し時間がかかる場合があります）
✅ インデックス作成完了！

📊 結果:
   • 関数発見数: 234
   • 処理ファイル数: 67
   • 出力: core-functions.jsonl

💡 プロのヒント：より良い整理のためにドメイン分類を使用
```

#### 次のステップ
```bash
# ドメインで異なる部分をスキャン
npx github:akiramei/function-indexer --root ./packages/api --domain backend
npx github:akiramei/function-indexer --root ./packages/ui --domain frontend

# メトリクス追跡を設定
fx metrics collect --root ./packages/core
```

</details>

<details>
<summary>🔄 <strong>レガシーコードを含む既存プロジェクト</strong></summary>

#### インストールと初回実行
```bash
# 前提条件（Linux/WSLユーザー）
sudo apt update && sudo apt install build-essential python3

# プロジェクトに移動
cd your-existing-project
npx github:akiramei/function-indexer --verbose
```

#### 表示される内容
```
🚀 Function Indexerへようこそ！
📁 スキャン中: ./
⚠️  混在ファイルタイプを発見、TypeScript/JavaScriptに焦点
✅ いくつかの警告付きでインデックス作成完了

📊 結果:
   • 関数発見数: 156
   • 処理ファイル数: 43
   • 警告: 3 (--verbose出力を参照)
   • 出力: function-index.jsonl

🔍 品質概要:
   ⚠️  12個の関数が複雑度しきい値を超過
   ⚠️  5個の関数が非常に長い（>50行）
```

#### 次のステップ
```bash
# コード品質の問題をチェック
fx metrics trends

# 問題領域に焦点を当てる
fx s "TODO" --context "fix"
fx s "legacy" --context "refactor"
```

</details>

---

## 📊 結果の理解

### 出力ファイル構造
Function Indexerは`function-index.jsonl`ファイルを作成し、各行が1つの関数を表します：

```json
{
  "file": "src/auth/login.ts",
  "identifier": "validateUser",
  "signature": "async validateUser(email: string, password: string): Promise<User>",
  "startLine": 15,
  "endLine": 28,
  "exported": true,
  "async": true,
  "metrics": {
    "linesOfCode": 12,
    "cyclomaticComplexity": 3,
    "cognitiveComplexity": 4,
    "nestingDepth": 2,
    "parameterCount": 2,
    "hasReturnType": true
  }
}
```

### 主要フィールドの説明
- **`file`**: 関数の場所
- **`identifier`**: 関数名（メソッドの場合はクラスコンテキストを含む）
- **`signature`**: 完全な関数シグネチャ
- **`metrics`**: コード品質の測定値
- **`exported`**: 関数がエクスポートされているか（パブリックAPI）
- **`async`**: 関数が非同期か

### 品質メトリクスガイド
- **循環的複雑度**（しきい値：10）：コード内の決定ポイント
- **認知的複雑度**（しきい値：15）：コードの理解の難しさ
- **コード行数**（しきい値：50）：実際のコード行（中括弧/コメントを除く）
- **ネストの深さ**（しきい値：4）：if/for/while文の最大深度
- **パラメータ数**（しきい値：4）：関数パラメータの数

---

## 🔧 基本コマンド

### 1. 基本スキャン
```bash
# 現在のディレクトリをスキャン
fx

# カスタム出力で特定のディレクトリをスキャン
fx --root ./src --output my-functions.jsonl

# ドメイン分類でスキャン
fx --root ./backend --domain api
```

### 2. 関数を検索
```bash
# 自然言語検索
fx s "認証"
fx s "ユーザー検証"
fx s "エラー処理"

# パターンベース検索
fx search --pattern "handle*Error"
fx search --pattern "validate*" --async-only

# コンテキスト認識検索
fx s "login" --context "auth"
```

### 3. 品質分析
```bash
# 品質概要を表示
fx m
fx metrics

# 追跡のためにメトリクスを収集
fx metrics collect --root ./src

# トレンドと違反を表示
fx metrics trends

# 特定の関数履歴をチェック
fx metrics show "src/auth.ts:validateUser"
```

### 4. リストとフィルタ
```bash
# すべての関数をリスト
fx ls

# 条件でフィルタ
fx ls --exported-only
fx ls --complexity ">10"
fx ls --file "src/auth.ts"
fx ls --async-only
```

---

## 🎯 ディープダイブ：プロジェクト統合

### ステップ1：設定セットアップ

Function Indexerは自動的に設定ファイルを作成しますが、カスタマイズできます：

#### コア設定（`.function-indexer/config.json`）
```json
{
  "version": "1.1.0",
  "root": "./src",
  "output": "function-index.jsonl",
  "domain": "main",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"]
}
```

#### メトリクス設定（`.function-indexer/metrics-config.json`）
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
    "maxHistoryDays": 365
  }
}
```

### ステップ2：開発ワークフロー統合

#### プリコミット品質ゲート
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Function Indexer品質チェックを実行中..."
fx metrics collect --root ./src

# 違反をチェック
fx metrics trends --format json > /tmp/violations.json
if [ -s /tmp/violations.json ]; then
    echo "❌ コード品質違反が検出されました！"
    fx metrics trends
    exit 1
fi

echo "✅ 品質チェック合格"
```

#### Package.jsonスクリプト
```json
{
  "scripts": {
    "analyze": "fx --root ./src",
    "quality": "fx metrics",
    "quality:collect": "fx metrics collect --root ./src",
    "quality:trends": "fx metrics trends",
    "search": "fx s"
  }
}
```

### ステップ3：チームコラボレーション

#### PR分析ワークフロー
```bash
# 作業開始前
fx metrics collect --root ./src --pr 123

# 変更完了後
fx metrics collect --root ./src --pr 123

# 変更をレビュー
fx metrics pr 123
```

#### コードレビューヘルパー
```bash
# レビュー優先度のために複雑な関数を検索
fx ls --complexity ">10" --lines ">30"

# 注意が必要な特定のパターンを検索
fx s "TODO" --context "refactor"
fx s "FIXME" --context "bug"
```

### ステップ4：CI/CD統合

#### GitHub Actions例
```yaml
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
        run: |
          fx metrics trends --format json > violations.json
          if [ -s violations.json ]; then
            echo "品質違反が検出されました:"
            fx metrics trends
            exit 1
          fi
```

---

## 🚀 マスタリーとベストプラクティス

### 段階的分析戦略

#### 1. 初期評価（5分）
```bash
# 全体像を把握
fx metrics

# ホットスポットを特定
fx metrics trends

# 一般的な問題を検索
fx s "any" --context "type"
fx s "console.log"
```

#### 2. 焦点を絞った調査（15分）
```bash
# 特定の違反を分析
fx metrics show "src/complex-file.ts:complexFunction"

# 関連パターンを検索
fx s "認証" --context "セキュリティ"
fx s "エラー" --context "処理"

# 高リスク関数をリスト
fx ls --complexity ">15" --lines ">40"
```

#### 3. 体系的な改善（継続的）
```bash
# 定期的な追跡を設定
fx metrics collect --root ./src

# トレンドを監視
fx metrics trends --since "1 week ago"

# PRの影響をレビュー
fx metrics pr <pr-number>
```

### 品質重視のワークフロー

#### 日次コード品質チェック
```bash
#!/bin/bash
# daily-quality.sh

echo "📊 日次コード品質レポート"
echo "=========================="

# 全体的なメトリクス
fx metrics

echo ""
echo "🎯 最近のトレンド:"
fx metrics trends --since "1 day ago"

echo ""
echo "⚠️  注意が必要な関数:"
fx ls --complexity ">10" --lines ">30" | head -10
```

#### リファクタリングワークフロー
```bash
# 1. 候補を特定
fx ls --complexity ">15" --exported-only

# 2. 特定の関数を分析
fx metrics show "src/target.ts:complexFunction"

# 3. 改善を追跡
fx metrics collect --root ./src --note "リファクタリング前"
# ... 変更を実施 ...
fx metrics collect --root ./src --note "リファクタリング後"
```

#### コードレビュー準備
```bash
# レビュー重視の分析を生成
echo "🔍 このPRで変更された関数:"
fx metrics pr $(git log --oneline -1 | cut -d' ' -f1)

echo ""
echo "⚠️  複雑度違反:"
fx metrics trends --pr-only

echo ""
echo "🎯 レビューする検索パターン:"
fx s "TODO" --context "review"
fx s "FIXME" --context "urgent"
```

### 高度な検索テクニック

#### セマンティック検索例
```bash
# アーキテクチャパターン
fx s "singleton" --context "pattern"
fx s "factory" --context "creation"
fx s "observer" --context "event"

# セキュリティ重視の検索
fx s "auth" --context "security"
fx s "validate" --context "input"
fx s "sanitize" --context "xss"

# パフォーマンス関連の検索
fx s "cache" --context "performance"
fx s "async" --context "optimization"
fx s "batch" --context "processing"
```

#### パターンベースの発見
```bash
# APIパターン
fx search --pattern "*Handler" --exported-only
fx search --pattern "*Controller" --async-only
fx search --pattern "*Service" --complexity "<5"

# ユーティリティパターン
fx search --pattern "is*" --lines "<10"
fx search --pattern "get*" --return-type-required
fx search --pattern "validate*" --parameter-count ">2"
```

### 開発ツールとの統合

#### VS Code統合
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "関数を分析",
      "type": "shell",
      "command": "fx",
      "args": ["--root", "./src"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always"
      }
    },
    {
      "label": "品質チェック",
      "type": "shell",
      "command": "fx",
      "args": ["metrics", "trends"],
      "group": "test"
    }
  ]
}
```

#### ESLint統合
```javascript
// Function Indexerデータに基づくカスタムESLintルール
// .eslintrc.js
module.exports = {
  rules: {
    'max-complexity': ['error', { max: 10 }], // Function Indexerしきい値に合わせる
    'max-lines-per-function': ['error', { max: 50 }],
    'max-params': ['error', { max: 4 }]
  }
};
```

---

## 🔧 一般的な問題と解決策

### インストールの問題

#### 問題：「build-essentialが見つかりません」
```bash
# 解決策：最初にパッケージリストを更新
sudo apt update
sudo apt install build-essential python3-dev
```

#### 問題：グローバルインストール時の「権限が拒否されました」
```bash
# 解決策：グローバルインストールの代わりにnpxを使用
npx github:akiramei/function-indexer

# またはnpm権限を修正
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

### 解析の問題

#### 問題：「TypeScriptファイルの解析に失敗しました」
```bash
# 解決策1：TypeScriptコンパイルをチェック
npx tsc --noEmit

# 解決策2：詳細を見るために詳細モードを使用
fx --verbose --root ./src

# 解決策3：問題のあるファイルを除外
fx --root ./src --exclude "**/*.d.ts" --exclude "**/generated/**"
```

#### 問題：「関数が見つかりません」
```bash
# 解決策：ファイルパターンをチェック
fx --root ./src --include "**/*.js" --include "**/*.ts"

# またはディレクトリ構造を確認
ls -la src/
```

### パフォーマンスの問題

#### 問題：「スキャンに時間がかかりすぎる」
```bash
# 解決策1：不要なディレクトリを除外
fx --root ./src --exclude "**/node_modules/**" --exclude "**/dist/**"

# 解決策2：小さなチャンクを処理
fx --root ./src/core --output core.jsonl
fx --root ./src/utils --output utils.jsonl
```

#### 問題：「大規模コードベースでメモリ不足」
```bash
# 解決策：Node.jsメモリ制限を増やす
NODE_OPTIONS="--max-old-space-size=4096" fx --root ./src
```

### 出力の問題

#### 問題：「JSONLファイルが空」
```bash
# 解決策：書き込み権限をチェック
ls -la function-index.jsonl

# または異なる出力場所を指定
fx --root ./src --output ./outputs/functions.jsonl
```

#### 問題：「メトリクスデータベースがロックされています」
```bash
# 解決策：他のFunction Indexerプロセスを閉じる
pkill -f function-indexer

# またはメトリクスデータベースをリセット
rm -rf .function-metrics/
fx metrics collect --root ./src
```

---

## 🎉 次のステップ

おめでとうございます！Function Indexerを効果的に使用する準備ができました。次に探索すること：

### 個人開発者向け
1. **提供されたスクリプトを使用して日次品質チェックを設定**
2. **シームレスなワークフローのためにIDEと統合**
3. **特定のドメインの高度な検索パターンを探索**

### チーム向け
1. **自動品質ゲートのためにCI/CD統合を設定**
2. **メトリクス設定でチーム品質しきい値を確立**
3. **一般的なコードレビューのための共有検索パターンを作成**

### AI支援開発向け
1. **コード分析のためにAIツールでJSONL出力を使用**
2. **AI駆動の洞察のために自動品質レポートを設定**
3. **高度なパターンのためにAI統合ガイドを探索**

### 追加リソース
- [📖 AI統合ガイド](AI-INTEGRATION-ja.md) - 包括的なAIアシスタントリファレンス
- [📚 コマンドリファレンス](COMMAND-REFERENCE-ja.md) - 完全なコマンドドキュメント
- [🔧 高度な使用法](ADVANCED-USAGE-ja.md) - エンタープライズパターンとCI/CD
- [❓ トラブルシューティング](TROUBLESHOOTING-ja.md) - 詳細な問題解決ガイド

---

**ハッピーコーディング！** 🎯

> 💡 **プロのヒント**：毎朝`fx metrics`から始めてコードベースの品質概要を取得し、その後`fx s "<topic>"`を使用して作業している特定の領域に深く掘り下げてください。