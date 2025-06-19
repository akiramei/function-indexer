# Function Indexer

TypeScript関数一覧化ツール - AI開発支援のためのコード管理システム

## インストール

```bash
npm install
npm run build
```

## 使用方法

### 基本的な使用

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

## 今後の拡張予定

- [ ] 関数の複雑度計算
- [ ] 類似関数の検出
- [ ] 検索履歴システム
- [ ] Git連携
- [ ] Web UI
- [ ] VSCode拡張