# ⚡ クイックスタートガイド

## 🌐 言語選択 / Language Selection

[**English**](QUICK-START.md) | **日本語** (ここにいます)

> 60秒でプロジェクトにFunction Indexerを導入

## 🎯 プロジェクトタイプを選択

<details>
<summary>🟦 <strong>TypeScript/Node.jsプロジェクト</strong></summary>

### インストール
```bash
npm install -g github:akiramei/function-indexer
cd your-typescript-project
function-indexer
```

### 表示される内容
```
🚀 Function Indexerへようこそ！
✨ TypeScriptプロジェクトを検出しました: /your/project
✅ .function-indexer/ に設定を作成しました
📁 スキャン中: src/
✅ インデックス化完了！
📊 見つかった関数: 42
```

### 次のステップ
```bash
# コード品質を確認
function-indexer metrics

# 関数を検索
function-indexer search "database"
```

### 一般的な用途
- **API開発**: ルートハンドラーとミドルウェアを見つける
- **ライブラリ作成**: エクスポートされた関数と複雑度を追跡
- **リファクタリング**: 分割が必要な複雑な関数を特定

</details>

<details>
<summary>⚛️ <strong>Reactプロジェクト</strong></summary>

### インストール
```bash
npm install -g github:akiramei/function-indexer
cd your-react-app
function-indexer
```

### 解析対象
- ✅ Reactコンポーネント（関数型・クラス型）
- ✅ カスタムフック（useState、useEffectなど）
- ✅ ユーティリティ関数
- ✅ イベントハンドラー
- ✅ JSX/TSXサポート

### クイックコマンド
```bash
# Reactコンポーネントを見つける
function-indexer search "component"

# カスタムフックを見つける
function-indexer search "hook use"

# コンポーネントの複雑度をチェック
function-indexer metrics --details
```

### 出力例
```
🔍 検索対象: "component"

1. UserProfile (src/components/UserProfile.tsx:10)
   function UserProfile(props: UserProps): JSX.Element

2. LoginForm (src/components/auth/LoginForm.tsx:15)
   const LoginForm: React.FC<LoginProps> = ({ onSubmit })
```

</details>

<details>
<summary>🟨 <strong>JavaScriptプロジェクト</strong></summary>

### インストール
```bash
npm install -g github:akiramei/function-indexer
cd your-js-project
function-indexer
```

### 純粋なJavaScript用セットアップ
```bash
# Function Indexerは.jsファイルも動作します！
function-indexer
```

### JSDocで強化
```javascript
/**
 * メールアドレスとパスワードでユーザーを認証
 * @param {string} email - ユーザーのメールアドレス
 * @param {string} password - ユーザーのパスワード
 * @returns {Promise<User>} 認証されたユーザー
 */
async function authenticateUser(email, password) {
  // ここにコードを記述
}
```

### クイックコマンド
```bash
# すべての関数を見つける
function-indexer search "function"

# 複雑度メトリクスを表示
function-indexer metrics
```

</details>

<details>
<summary>🏗️ <strong>モノレポ/マルチパッケージ</strong></summary>

### インストール
```bash
npm install -g github:akiramei/function-indexer
cd your-monorepo
```

### 各パッケージのセットアップ
```bash
# 各パッケージを個別に解析
cd packages/frontend
function-indexer

cd ../backend  
function-indexer

cd ../shared
function-indexer
```

### 統合解析（高度）
```bash
# モノレポルートから
function-indexer --root packages/frontend
function-indexer --root packages/backend

# パッケージ間の複雑度を比較
function-indexer metrics --details
```

### ワークスペース統合
```json
// モノレポルートのpackage.json
{
  "scripts": {
    "analyze": "npm run analyze:frontend && npm run analyze:backend",
    "analyze:frontend": "cd packages/frontend && function-indexer",
    "analyze:backend": "cd packages/backend && function-indexer"
  }
}
```

</details>

<details>
<summary>⚡ <strong>Next.jsプロジェクト</strong></summary>

### インストール
```bash
npm install -g github:akiramei/function-indexer
cd your-nextjs-app
function-indexer
```

### Function Indexerが見つけるもの
- ✅ ページコンポーネント（`pages/` または `app/`）
- ✅ APIルート（`pages/api/` または `app/api/`）
- ✅ サーバーコンポーネント
- ✅ クライアントコンポーネント
- ✅ カスタムフック
- ✅ ユーティリティ関数

### Next.js固有コマンド
```bash
# APIルートを見つける
function-indexer search "api route handler"

# ページコンポーネントを見つける
function-indexer search "page component"

# SSR/SSG関数をチェック
function-indexer search "getServerSideProps getStaticProps"
```

### 出力例
```
📊 コード品質メトリクス

見つかったAPIルート: 8
ページコンポーネント: 12
カスタムフック: 5
ユーティリティ関数: 23

⚠️ 複雑なAPIルート:
  • pages/api/users/[id].ts:handler (複雑度: 12)
```

</details>

<details>
<summary>🔧 <strong>Express.js API</strong></summary>

### インストール
```bash
npm install -g github:akiramei/function-indexer
cd your-express-api
function-indexer
```

### Express固有解析
Function IndexerはExpress APIの解析に優れています：

```bash
# ルートハンドラーを見つける
function-indexer search "route handler"

# ミドルウェア関数を見つける
function-indexer search "middleware"

# コントローラーの複雑度をチェック
function-indexer search "controller"
```

### サンプルプロジェクト構造
```
src/
├── controllers/
├── middleware/
├── routes/
├── services/
└── utils/
```

### クイック健全性チェック
```bash
# API複雑度をチェック
function-indexer metrics

# リファクタリング候補を見つける
function-indexer metrics --details
```

</details>

<details>
<summary>📱 <strong>React Nativeプロジェクト</strong></summary>

### インストール
```bash
npm install -g github:akiramei/function-indexer
cd your-react-native-app
function-indexer
```

### React Native機能
- ✅ スクリーンコンポーネント
- ✅ カスタムフック
- ✅ ナビゲーション関数
- ✅ プラットフォーム固有コード
- ✅ ネイティブモジュールインターフェース

### クイックコマンド
```bash
# スクリーンコンポーネントを見つける
function-indexer search "screen component"

# ナビゲーション関数を見つける
function-indexer search "navigation"

# コンポーネントの複雑度をチェック
function-indexer metrics
```

</details>

## 🔄 汎用コマンド

プロジェクトタイプに関係なく、これらのコマンドはどこでも動作します：

```bash
# 基本インデックス化
function-indexer

# コード品質概要
function-indexer metrics

# 関数検索
function-indexer search "your query"

# ヘルプ
function-indexer --help
```

## 🎯 プロジェクト固有のヒント

### フロントエンドプロジェクト（React、Vue、Angular）
```bash
# コンポーネントの複雑度に焦点
function-indexer search "component" | head -20

# イベントハンドラーを見つける
function-indexer search "onClick onSubmit onChange"
```

### バックエンドプロジェクト（Node.js、Express）
```bash
# API健全性チェック
function-indexer search "route handler" 

# ミドルウェア解析
function-indexer search "middleware auth"
```

### ライブラリプロジェクト
```bash
# パブリックAPI概要
function-indexer search "export" --context "public"

# 公開前の複雑度
function-indexer metrics --details
```

## ⚠️ トラブルシューティング

<details>
<summary><strong>関数が見つからない？</strong></summary>

**考えられる原因:**
- 予想される場所にTypeScript/JavaScriptファイルがない
- ファイルが非標準ディレクトリにある

**解決方法:**
```bash
# カスタムディレクトリを指定
function-indexer --root ./your-custom-src

# Function Indexerが検出した内容をチェック
function-indexer --verbose
```

</details>

<details>
<summary><strong>一部のファイルが欠けている？</strong></summary>

**設定をチェック:**
```bash
# 現在の設定を表示
cat .function-indexer/config.json

# より多くのファイルパターンを追加
# 設定を編集して含める: ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"]
```

</details>

<details>
<summary><strong>偽陽性が多すぎる？</strong></summary>

**不要なディレクトリを除外:**
```json
{
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts", 
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**"
  ]
}
```

</details>

## 🎉 成功！

これでコードベースを解析する準備が整いました！

**次のステップ:**
- 📖 高度な機能について[完全チュートリアル](TUTORIAL-ja.md)を試す
- 🔧 カスタマイズについて[設定ガイド](CONFIGURATION.md)をチェック
- 🤝 [コミュニティ](https://github.com/akiramei/function-indexer/discussions)に参加

---

**⭐ Function Indexerを気に入りましたか？** プロジェクトにスターを付けてチームと共有してください！