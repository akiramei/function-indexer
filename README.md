# Function Indexer

TypeScript関数一覧化ツール - AI開発支援のためのコード管理システム

## 🚀 Phase 2 Features (New!)

- 🔍 **Natural Language Search**: Search functions using everyday language
- 🤖 **AI-Powered Descriptions**: Automatically generate descriptions and tags using OpenAI
- 📊 **Search History**: Track and learn from search patterns
- 🏷️ **Smart Categorization**: AI-driven function categorization and tagging

## インストール

```bash
npm install
npm run build
```

### AI機能の設定

AI機能を使用する場合は、OpenAI APIキーが必要です：

1. `.env` ファイルを作成:
```bash
cp .env.example .env
```

2. APIキーを設定:
```
OPENAI_API_KEY=your-api-key-here
```

## 使用方法

### 基本的な使用（インデックス作成）

```bash
# srcディレクトリをスキャンして関数一覧を作成
npm run start -- --root ./src --output function-index.jsonl --domain backend

# または開発時
npm run dev -- --root ./src --output function-index.jsonl --domain backend
```

### コマンドオプション

| オプション | 短縮形 | デフォルト | 説明 |
|-----------|--------|-----------|------|
| `--root` | `-r` | `./src` | スキャン対象のルートディレクトリ |
| `--output` | `-o` | `function-index.jsonl` | 出力ファイルパス |
| `--domain` | `-d` | `default` | 関数のドメイン名 |
| `--include` | - | `**/*.ts,**/*.tsx` | 含めるファイルパターン |
| `--exclude` | - | `**/*.test.ts,**/*.spec.ts,**/node_modules/**` | 除外するファイルパターン |
| `--verbose` | `-v` | `false` | 詳細な出力 |

### 使用例

```bash
# フロントエンド用の関数一覧
function-indexer --root ./frontend --domain frontend --output frontend-functions.jsonl

# バックエンド用（テストファイルも含める）
function-indexer --root ./backend --domain backend --exclude "**/node_modules/**" -v

# 特定のディレクトリのみ
function-indexer --root ./src/services --include "**/*.ts" --domain services
```

## 出力フォーマット

JSONL形式で各行に1つの関数情報が出力されます：

```json
{
  "file": "src/image/processor.ts",
  "identifier": "resizeImage",
  "signature": "async resizeImage(buffer: Buffer, width: number, height: number): Promise<Buffer>",
  "startLine": 15,
  "endLine": 45,
  "hash_function": "a41f22bc",
  "hash_file": "dc093e7f",
  "exported": true,
  "async": true,
  "metrics": {
    "linesOfCode": 31,
    "parameterCount": 3,
    "hasReturnType": true
  },
  "domain": "backend"
}
```

## 対応する関数タイプ

- **関数宣言**: `function myFunction() {}`
- **クラスメソッド**: `class MyClass { myMethod() {} }`
- **アロー関数**: `const myFunc = () => {}`
- **関数式**: `const myFunc = function() {}`

## プロジェクト構造

```
function-indexer/
├── src/
│   ├── cli.ts          # CLIエントリーポイント
│   ├── indexer.ts      # メインロジック
│   ├── types.ts        # 型定義
│   └── index.ts        # エクスポート
├── dist/               # ビルド成果物
├── package.json
├── tsconfig.json
└── README.md
```

## 開発

```bash
# 依存関係のインストール
npm install

# 開発モードで実行
npm run dev -- --root ./test-src --verbose

# ビルド
npm run build

# テスト実行
npm test
```

## エラーハンドリング

- 解析に失敗したファイルは警告として記録され、処理を継続します
- `--verbose` オプションで詳細なエラー情報を確認できます
- 致命的なエラー（存在しないディレクトリなど）の場合はプロセスが終了します

### 🔍 関数検索（Phase 2新機能）

```bash
# 自然言語で関数を検索
function-indexer search "画像をリサイズする関数"

# コンテキストを指定して検索
function-indexer search "ファイルを読み込む" --context "ユーザーアップロード処理"

# 検索履歴を保存しない
function-indexer search "async function" --no-save-history
```

### 🤖 AI説明文生成（Phase 2新機能）

```bash
# 関数の説明文とタグを自動生成
function-indexer generate-descriptions

# バッチサイズを指定
function-indexer generate-descriptions --batch-size 20

# カスタム出力ファイル
function-indexer generate-descriptions --output enhanced-functions.jsonl
```

### 📜 検索履歴の確認（Phase 2新機能）

```bash
# 全ての検索履歴を表示
function-indexer show-history

# 特定のキーワードでフィルタ
function-indexer show-history --query "image"
```

## 拡張された出力フォーマット（AI機能使用時）

```json
{
  "file": "src/image/processor.ts",
  "identifier": "resizeImage",
  "signature": "async resizeImage(buffer: Buffer, width: number, height: number): Promise<Buffer>",
  "startLine": 15,
  "endLine": 45,
  "hash_function": "a41f22bc",
  "hash_file": "dc093e7f",
  "exported": true,
  "async": true,
  "metrics": {
    "linesOfCode": 31,
    "parameterCount": 3,
    "hasReturnType": true
  },
  "domain": "backend",
  "description": "Resizes an image buffer to specified dimensions",
  "tags": ["image-processing", "async", "buffer"],
  "purpose": "image-manipulation",
  "dependencies": ["sharp", "Buffer"]
}
```

## 今後の拡張予定

### ✅ 完了（Phase 2）
- [x] 検索履歴システム
- [x] AI説明文生成
- [x] 自然言語検索

### 📋 今後の予定
- [ ] Git連携とインクリメンタル更新（Phase 3）
- [ ] 関数の複雑度計算（Phase 4）
- [ ] 類似関数の検出（Phase 4）
- [ ] Web UI（Phase 4）
- [ ] VSCode拡張（Phase 5）