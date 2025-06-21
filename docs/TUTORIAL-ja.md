# 📚 Function Indexer チュートリアル

> 5分でFunction Indexerを使いこなすための完全ステップバイステップガイド

## 🎯 このチュートリアルで学ぶこと

このチュートリアルを終える頃には、以下ができるようになります：
- ✅ 任意のTypeScriptプロジェクトでFunction Indexerをインストール・セットアップ
- ✅ コードベースを解析してメトリクスを理解
- ✅ 検索機能を使って関数を素早く見つける
- ✅ Function Indexerを開発ワークフローに統合

## 📋 前提条件

- Node.js 16+ がインストールされている
- TypeScript/JavaScriptプロジェクト（または作成意欲）
- 5分の時間

## 🚀 パート1: インストールと初回実行

### ステップ1: Function Indexerをインストール

```bash
# グローバルインストール（推奨）
npm install -g function-indexer

# またはプロジェクトにインストール
npm install --save-dev function-indexer
```

### ステップ2: プロジェクトに移動

```bash
# 任意のTypeScriptプロジェクトに移動
cd my-awesome-project

# またはサンプルプロジェクトを作成して一緒に進める
mkdir function-indexer-demo
cd function-indexer-demo
npm init -y
npm install typescript @types/node
```

### ステップ3: 初回インデックス作成

```bash
# 実行するだけ - 設定不要！
function-indexer
```

**何が起こる？** Function Indexerは：
1. 🔍 プロジェクトタイプを自動検出（TypeScript/JavaScript）
2. 📁 ソースディレクトリを見つける（`src/`、`lib/`など）
3. 🏗️ `.function-indexer/` ディレクトリを作成
4. 📊 関数インデックスを生成
5. ✨ サマリーを表示

**期待される出力:**
```
🚀 Function Indexerへようこそ！
✨ TypeScriptプロジェクトを検出しました: /Users/you/my-project
✅ .function-indexer/ に設定を作成しました
📁 スキャン中: src/
📄 出力: .function-indexer/index.jsonl
✅ インデックス化完了！
📊 見つかった関数: 23
📁 処理したファイル: 8
```

## 🔍 パート2: コードを理解する

### ステップ4: コード品質メトリクスを表示

```bash
function-indexer metrics
```

**サンプル出力:**
```
📊 コード品質メトリクス

📈 サマリー:
  総関数数: 23
  低リスク: 18 (78%)
  中リスク: 4 (17%)
  高リスク: 1 (4%)

⚠️ 閾値を超えた関数:
  1. src/auth/login.ts:authenticateUser
     - 循環的複雑度: 12 (>10)
     - 認知的複雑度: 18 (>15)

💡 提案:
  • 複雑な関数の分割を検討
  • ネストを減らすためのヘルパーメソッドの抽出
  • 複雑なロジックへの単体テストの追加
```

### ステップ5: 関数を検索

```bash
# 認証関連の関数を見つける
function-indexer search "authentication"

# ユーザーデータを扱う関数を見つける
function-indexer search "user profile"

# より良い結果のためにコンテキストを付けて検索
function-indexer search "database query" --context "user management"
```

**サンプル出力:**
```
🔍 検索対象: "authentication"

3つのマッチした関数が見つかりました:

1. authenticateUser (src/auth/login.ts:15)
   async function authenticateUser(email: string, password: string): Promise<User>
   ⚠️ 高複雑度: 12

2. validateToken (src/auth/middleware.ts:8)
   function validateToken(token: string): boolean

3. generateAuthCode (src/auth/utils.ts:22)
   function generateAuthCode(): string
```

## 🔄 パート3: 開発ワークフロー統合

### ステップ6: インデックスを最新に保つ

```bash
# 変更後に更新
function-indexer

# スマート！変更されたファイルのみを処理します
```

### ステップ7: プロジェクト固有設定（オプション）

`.function-indexer/config.json`を作成してカスタマイズ：

```json
{
  "include": ["**/*.ts", "**/*.tsx", "**/*.js"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "**/dist/**"],
  "metrics": {
    "thresholds": {
      "cyclomaticComplexity": 8,
      "cognitiveComplexity": 12,
      "linesOfCode": 40
    }
  }
}
```

## 🏗️ パート4: 実世界の例

### 例1: 複雑な関数のリファクタリング

**前:** 複雑な関数がある
```typescript
// src/payment/processor.ts
export async function processPayment(order: Order, card: Card, options: PaymentOptions) {
  // 50行の複雑なロジック...
  // 循環的複雑度: 15
}
```

**Function Indexerを実行:**
```bash
function-indexer metrics --details
```

**出力が表示:**
```
⚠️ 高複雑度関数が見つかりました:
   src/payment/processor.ts:processPayment
   - 循環的複雑度: 15 (>10)
   - 行数: 50 (>40)
   - 認知的複雑度: 20 (>15)
```

**リファクタリング後:** 分割する
```typescript
export async function processPayment(order: Order, card: Card, options: PaymentOptions) {
  validatePaymentRequest(order, card);
  const session = await createPaymentSession(order, options);
  return await executePayment(session, card);
}

function validatePaymentRequest(order: Order, card: Card) { /* ... */ }
async function createPaymentSession(order: Order, options: PaymentOptions) { /* ... */ }
async function executePayment(session: PaymentSession, card: Card) { /* ... */ }
```

**再実行して改善を確認:**
```bash
function-indexer
function-indexer metrics
```

### 例2: デッドコードの発見

```bash
# 使われていない可能性のある関数を検索
function-indexer search "helper" --limit 20

# 最近更新されていない関数を探す
function-indexer metrics | grep "Last updated"
```

### 例3: コードレビュー準備

```bash
# PRを提出する前にコード品質をチェック
function-indexer metrics

# 変更した関数を検索
function-indexer search "user authentication login"

# PR説明用のサマリーを取得
function-indexer | grep "Functions found"
```

## 📁 パート5: プロジェクトタイプ例

### Reactプロジェクト
```bash
cd my-react-app
function-indexer  # TSXファイルを自動検出

# Reactコンポーネントを見つける
function-indexer search "component"

# カスタムフックを見つける
function-indexer search "use"
```

### Node.js APIプロジェクト
```bash
cd my-api-server
function-indexer

# ルートハンドラーを見つける
function-indexer search "route handler"

# ミドルウェア関数を見つける
function-indexer search "middleware"
```

### ライブラリ/パッケージプロジェクト
```bash
cd my-library
function-indexer

# エクスポートされた関数を見つける
function-indexer search "export" --context "public API"

# 公開前に複雑度をチェック
function-indexer metrics
```

## 🔧 パート6: 高度な使用法

### Gitフックとの統合

`.husky/pre-commit`を作成：
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# コミット前に関数インデックスを更新
function-indexer

# 高複雑度関数をチェック
if function-indexer metrics | grep -q "High Risk"; then
  echo "⚠️ 高複雑度関数が検出されました。リファクタリングを検討してください。"
  function-indexer metrics --details
fi
```

### CI/CD統合

GitHub Actionsに追加：
```yaml
name: コード品質チェック
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Function Indexerをインストール
        run: npm install -g function-indexer
      
      - name: コード品質を解析
        run: |
          function-indexer
          function-indexer metrics
          
      - name: 高複雑度をチェック
        run: |
          if function-indexer metrics | grep -q "High Risk"; then
            echo "::warning::高複雑度関数が検出されました"
            function-indexer metrics --details
          fi
```

## 🎉 おめでとうございます！

これでFunction Indexerをマスターしました！以下ができるようになりました：

✅ **自動解析** 任意のTypeScript/JavaScriptプロジェクトの  
✅ **品質追跡** 意味のあるメトリクスで  
✅ **関数検索** 自然言語を使って  
✅ **ワークフロー統合** 開発プロセスに  
✅ **複雑度監視** コード品質を維持  

## 🆘 ヘルプが必要？

- 📖 [トラブルシューティングガイド](TROUBLESHOOTING-ja.md)をチェック
- 🐛 [GitHub](https://github.com/akiramei/function-indexer/issues)で問題を報告
- 💬 [GitHub Discussions](https://github.com/akiramei/function-indexer/discussions)でディスカッションに参加

## 🎯 次は何？

- [高度設定ガイド](ADVANCED.md)を試す
- [CI/CD統合例](CI-CD.md)を探索
- [カスタムメトリクス](METRICS.md)について学ぶ

---

**⭐ このチュートリアルは役に立ちましたか？** GitHubでプロジェクトにスターを付けて、チームと共有してください！