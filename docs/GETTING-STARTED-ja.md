# 🚀 Function Indexer 入門ガイド

## 🌐 Language Selection / 言語選択

[English](GETTING-STARTED.md) | **日本語** (このページ)

> **Function Indexer初心者の方へ:** この包括的なガイドで、数分で0から実用的な活用まで学べます。

## 📖 学習内容

1. [**クイックインストール**](#-クイックインストール) - 60秒で開始
2. [**初回実行の流れ**](#-初回実行の流れ) - 最初に起こることを理解
3. [**必須コマンド**](#-必須コマンド) - 知っておくべき5つのコマンド
4. [**次のステップ**](#-次にやること) - 効果的なワークフローとベストプラクティス
5. [**トラブルシューティング**](#-よくある問題) - 一般的な問題の解決法

---

## ⚡ クイックインストール

### 前提条件
```bash
# Linux/WSLユーザーのみ（macOS/Windowsの場合はスキップ）
sudo apt update && sudo apt install build-essential python3
```

### ワンコマンドで開始
```bash
# TypeScript/JavaScriptプロジェクトディレクトリに移動
cd your-project

# Function Indexerを実行（インストール不要！）
npx github:akiramei/function-indexer
```

**以上です！** Function Indexerがプロジェクトを自動検出し、すべての関数のインデックスを作成します。

---

## 🎯 初回実行の流れ

Function Indexerを初回実行すると、以下のことが起こります：

### 1. プロジェクト検出
```
🚀 Welcome to Function Indexer!
✨ Detected typescript project at: /your/project
📁 Found source directories: src, lib
🎯 Suggested scan root: src
```

### 2. 自動設定
```
✅ Created configuration in .function-indexer/
📁 Scanning: ./src
📄 Output: function-index.jsonl
```

### 3. 関数解析
```
✅ Indexing completed!
📁 Files processed: 45
🔧 Functions found: 127
⏱️  Execution time: 1250ms
```

### 4. 次のステップガイダンス
次に何をすべきかの具体的な提案が表示されます - **これがFunction Indexerから価値を得るためのロードマップです！**

---

## 🔧 必須コマンド

この5つのコマンドでFunction Indexerの90%の使用をカバーできます：

### 1. **コードのインデックス/更新** (`fx`)
```bash
# 関数インデックスの初期化または更新
fx
# または完全なコマンド：
function-indexer
```
**使用タイミング:** 初回セットアップ、大きなコード変更後、日次更新

### 2. **関数の検索** (`fx s`)
```bash
# 自然言語で関数を検索
fx search "認証"
fx s "ユーザーログイン"          # 短縮エイリアス
fx s "データベース接続" # 名前だけでなく概念でも検索可能
```
**使用タイミング:** 特定機能の発見、コード探索、オンボーディング

### 3. **コード品質の表示** (`fx m`)
```bash
# 品質メトリクス概要
fx metrics
fx m              # 短縮エイリアス

# 関数レベルの詳細メトリクス
fx m --details
```
**使用タイミング:** コードレビュー、リファクタリング計画、品質チェック

### 4. **全関数の一覧表示** (`fx ls`)
```bash
# コードベース内のすべての関数を表示
fx list
fx ls             # 短縮エイリアス

# ファイルやパターンでフィルタ
fx ls --file "auth"
```
**使用タイミング:** プロジェクト概要の把握、未使用コードの発見

### 5. **変更の追跡** (`fx d`)
```bash
# ブランチ間の関数比較
fx diff main feature-branch
fx d main HEAD    # 短縮エイリアス

# 前回コミット以降の変更確認
fx d HEAD~1 HEAD
```
**使用タイミング:** コードレビュー、変更影響の理解

---

## 🎯 次にやること

初回実行が成功した後、以下のワークフローを順番に試してください：

### 🔍 **すぐに: コードベースの探索**
```bash
# プロジェクト構造に慣れる
fx ls

# 主要機能を検索
fx s "メイン関数"
fx s "API routes"
fx s "データベース"
```

### 📊 **1日目: コード品質の確認**
```bash
# 全体的なコードヘルスを確認
fx m

# リファクタリングが必要な複雑な関数を発見
fx m --details | grep "High complexity"

# 時系列での複雑度追跡
fx metrics collect
```

### 🔄 **1週目: ワークフローへの統合**
```bash
# コードレビュー前に
fx d main your-feature-branch

# 定期的な品質チェック
fx m

# 変更後のインデックス更新
fx
```

### 🤝 **2週目: チーム統合**
```bash
# チーム向けレポート生成
fx report --format markdown

# CI/CD統合設定
fx ci --format github

# 品質メトリクスの共有
fx metrics trends
```

---

## 🎨 プロジェクト別のヒント

### **React/フロントエンドプロジェクト**
```bash
# Reactコンポーネントを検索
fx s "component"

# フックを探す
fx s "useState useEffect"

# コンポーネントの複雑度チェック
fx m --details
```

### **Node.js/バックエンドプロジェクト**
```bash
# APIルートを検索
fx s "route handler"

# ミドルウェアを探す
fx s "middleware auth"

# データベース関数
fx s "database query"
```

### **ライブラリ/パッケージプロジェクト**
```bash
# エクスポート関数をチェック
fx s "export"

# 公開前にAPI複雑度を確認
fx m --details

# バージョン間の比較
fx d v1.0.0 main
```

---

## ⚠️ よくある問題

<details>
<summary><strong>🔍 「関数が見つからない」または結果が非常に少ない</strong></summary>

**原因:**
- Function Indexerが間違ったディレクトリをスキャンしている
- ソースファイルが標準的でない場所にある

**解決法:**
```bash
# 何が検出されたかを確認
fx --verbose

# カスタムソースディレクトリを指定
fx --root ./your-src-directory

# 設定を確認
cat .function-indexer/config.json
```

**必要に応じて設定を編集:**
```json
{
  "root": "./src",
  "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
}
```
</details>

<details>
<summary><strong>📁 「プロジェクトが初期化されていません」エラー</strong></summary>

**原因:** 基本的な`fx`コマンドを実行せずに検索/メトリクスを使おうとした。

**解決法:**
```bash
# 最初に基本的なインデックス作成を実行
fx

# その後、検索/メトリクスコマンドを再試行
fx s "your query"
```
</details>

<details>
<summary><strong>🐛 ビルドツールエラー（Linux/WSL）</strong></summary>

**原因:** ネイティブ依存関係にビルドツールが必要。

**解決法:**
```bash
# 必要なビルドツールをインストール
sudo apt update && sudo apt install build-essential python3

# Function Indexerを再実行
fx
```
</details>

<details>
<summary><strong>🔄 大きなコードベースでのパフォーマンス低下</strong></summary>

**解決法:**
```bash
# 不要なディレクトリを除外
fx --root ./src  # すべてをスキャンする代わりに

# .function-indexer/config.jsonを編集してより多くを除外:
{
  "exclude": [
    "**/node_modules/**",
    "**/dist/**", 
    "**/build/**",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```
</details>

---

## 🎉 成功チェックリスト

以下ができればFunction Indexerを成功的に使用しています：

- [ ] **プロジェクトの初期化** - `fx`がエラーなく完了する
- [ ] **効果的な検索** - `fx s "認証"`で関連する関数が見つかる
- [ ] **コード品質の理解** - `fx m`で意味のあるメトリクスが表示される
- [ ] **変更の追跡** - `fx d main feature`で関数の差分が表示される
- [ ] **ワークフローへの統合** - 定期的に`fx`を実行し、時間を節約できている

## 📚 次のステップは？

基本に慣れたら：

- **📖 [完全チュートリアル](TUTORIAL-ja.md)** - 実例での詳細解説
- **🔧 [設定ガイド](CONFIGURATION-ja.md)** - ニーズに合わせたカスタマイズ
- **🔗 [統合ガイド](INTEGRATIONS-ja.md)** - CI/CD、Gitフック、VS Code
- **👥 [チーム機能](TEAM-FEATURES-ja.md)** - 高度なコラボレーション機能
- **🤖 [AIアシスタントガイド](AI-GUIDE-ja.md)** - AIツールとの効果的な使用

## 🤝 サポートが必要ですか？

- **📋 [完全コマンドリファレンス](COMMAND-REFERENCE-ja.md)** - 全コマンドのドキュメント
- **🛠️ [トラブルシューティングガイド](TROUBLESHOOTING-ja.md)** - 詳細な問題解決
- **💬 [GitHub Discussions](https://github.com/akiramei/function-indexer/discussions)** - コミュニティサポート
- **🐛 [Issue報告](https://github.com/akiramei/function-indexer/issues)** - バグ報告と機能リクエスト

---

**🌟 Function Indexerを気に入りましたか？** プロジェクトにスターを付けて、チームと共有してください！