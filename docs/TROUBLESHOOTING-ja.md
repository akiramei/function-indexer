# 🔧 トラブルシューティングガイド

## 🌐 言語選択 / Language Selection

[**English**](TROUBLESHOOTING.md) | **日本語** (ここにいます)

> よくある問題とその解決方法

## 🚨 インストール問題

<details>
<summary><strong>❌ "command not found: function-indexer"</strong></summary>

**問題:** インストール後にFunction Indexerコマンドが認識されない。

**解決方法:**

1. **グローバルインストールをチェック:**
   ```bash
   npm list -g function-indexer
   ```

2. **グローバルに再インストール:**
   ```bash
   npm uninstall -g function-indexer
   npm install -g github:akiramei/function-indexer
   ```

3. **PATHをチェック:**
   ```bash
   echo $PATH
   npm config get prefix
   ```

4. **代替手段としてnpxを使用:**
   ```bash
   npx function-indexer
   ```

5. **ローカルインストールを使用:**
   ```bash
   npm install --save-dev function-indexer
   npx function-indexer
   ```

</details>

<details>
<summary><strong>❌ "Permission denied" エラー</strong></summary>

**問題:** グローバルインストール時の権限問題。

**解決方法:**

1. **Node Version Managerを使用（推奨）:**
   ```bash
   # 最初にnvmをインストール
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install node
   npm install -g github:akiramei/function-indexer
   ```

2. **npmが別のディレクトリを使用するよう設定:**
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   npm install -g github:akiramei/function-indexer
   ```

3. **sudoを使用（非推奨）:**
   ```bash
   sudo npm install -g github:akiramei/function-indexer
   ```

</details>

## 🔍 プロジェクト検出問題

<details>
<summary><strong>❌ "No TypeScript/JavaScript files found"</strong></summary>

**問題:** Function Indexerがソースファイルを見つけられない。

**解決方法:**

1. **現在のディレクトリをチェック:**
   ```bash
   pwd
   ls -la
   ```

2. **ルートディレクトリを指定:**
   ```bash
   function-indexer --root ./src
   function-indexer --root ./lib
   function-indexer --root ./app
   ```

3. **ファイル拡張子をチェック:**
   ```bash
   # .ts、.tsx、.js、または.jsxファイルがあることを確認
   find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -10
   ```

4. **詳細モードでデバッグ:**
   ```bash
   function-indexer --verbose
   ```

5. **カスタム設定:**
   ```json
   // .function-indexer/config.json
   {
     "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
     "exclude": ["**/node_modules/**"]
   }
   ```

</details>

<details>
<summary><strong>❌ "Project type detection failed"</strong></summary>

**問題:** Function Indexerがプロジェクトタイプを判定できない。

**解決方法:**

1. **package.jsonを作成:**
   ```bash
   npm init -y
   ```

2. **TypeScript設定を追加:**
   ```bash
   # 最小限のtsconfig.jsonを作成
   echo '{"compilerOptions": {"target": "ES2020"}}' > tsconfig.json
   ```

3. **プロジェクトマーカーをチェック:**
   ```bash
   # Function Indexerはこれらのファイルを探します
   ls -la package.json tsconfig.json .git
   ```

4. **プロジェクトルートから実行:**
   ```bash
   # 正しいディレクトリにいることを確認
   cd /path/to/your/project/root
   function-indexer
   ```

</details>

## 📁 ファイル処理問題

<details>
<summary><strong>❌ "Some files are being ignored"</strong></summary>

**問題:** 期待されるファイルが処理されていない。

**解決方法:**

1. **gitignoreパターンをチェック:**
   ```bash
   cat .gitignore
   # Function Indexerはデフォルトで.gitignoreを尊重します
   ```

2. **除外パターンをチェック:**
   ```bash
   cat .function-indexer/config.json
   ```

3. **除外をオーバーライド:**
   ```json
   {
     "include": ["**/*.ts", "**/*.tsx"],
     "exclude": ["**/*.test.ts"]
   }
   ```

4. **詳細ログ:**
   ```bash
   function-indexer --verbose
   ```

</details>

<details>
<summary><strong>❌ "Parsing errors in TypeScript files"</strong></summary>

**問題:** TypeScriptコンパイルエラーがインデックス化を妨げる。

**解決方法:**

1. **TypeScriptバージョンをチェック:**
   ```bash
   npx tsc --version
   npm list typescript
   ```

2. **コンパイルエラーを修正:**
   ```bash
   npx tsc --noEmit
   ```

3. **tsconfig.jsonを更新:**
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "strict": false,
       "skipLibCheck": true
     }
   }
   ```

4. **問題のあるファイルをスキップ:**
   ```json
   {
     "exclude": ["**/problematic-file.ts"]
   }
   ```

</details>

## 🏃 パフォーマンス問題

<details>
<summary><strong>⏱️ "Function Indexer is running very slowly"</strong></summary>

**問題:** 大きなコードベースでの長い処理時間。

**解決方法:**

1. **不要なディレクトリを除外:**
   ```json
   {
     "exclude": [
       "**/node_modules/**",
       "**/dist/**",
       "**/build/**",
       "**/.next/**",
       "**/coverage/**",
       "**/*.min.js"
     ]
   }
   ```

2. **特定のディレクトリを処理:**
   ```bash
   function-indexer --root ./src/core
   ```

3. **システムリソースをチェック:**
   ```bash
   # 実行中にモニター
   top
   htop
   ```

4. **インクリメンタル更新を使用:**
   ```bash
   # 最初の完全インデックス後、更新はずっと高速
   function-indexer
   ```

</details>

<details>
<summary><strong>💾 "Out of memory errors"</strong></summary>

**問題:** 非常に大きなコードベースでNode.jsがメモリ不足になる。

**解決方法:**

1. **Node.jsメモリを増加:**
   ```bash
   node --max-old-space-size=4096 $(which function-indexer)
   ```

2. **チャンクで処理:**
   ```bash
   function-indexer --root ./src/module1
   function-indexer --root ./src/module2
   ```

3. **大きなファイルを除外:**
   ```json
   {
     "exclude": ["**/*.bundle.js", "**/*.vendor.js"]
   }
   ```

</details>

## 🔧 設定問題

<details>
<summary><strong>❌ "Configuration file is not being read"</strong></summary>

**問題:** カスタム設定が無視されているようです。

**解決方法:**

1. **ファイル場所をチェック:**
   ```bash
   ls -la .function-indexer/config.json
   ```

2. **JSON構文を検証:**
   ```bash
   node -e "console.log(JSON.parse(require('fs').readFileSync('.function-indexer/config.json', 'utf8')))"
   ```

3. **設定をリセット:**
   ```bash
   rm -rf .function-indexer
   function-indexer
   ```

4. **BOM/エンコーディング問題をチェック:**
   ```bash
   file .function-indexer/config.json
   hexdump -C .function-indexer/config.json | head -1
   ```

</details>

<details>
<summary><strong>❌ "Metrics thresholds not working"</strong></summary>

**問題:** カスタム複雑度閾値が適用されていない。

**解決方法:**

1. **設定形式をチェック:**
   ```json
   {
     "metrics": {
       "thresholds": {
         "cyclomaticComplexity": 8,
         "cognitiveComplexity": 12,
         "linesOfCode": 40,
         "nestingDepth": 3,
         "parameterCount": 4
       }
     }
   }
   ```

2. **設定変更後に再起動:**
   ```bash
   function-indexer
   ```

3. **詳細出力で検証:**
   ```bash
   function-indexer metrics --verbose
   ```

</details>

## 🔍 検索問題

<details>
<summary><strong>❌ "Search returns no results"</strong></summary>

**問題:** 関数検索が期待されるマッチを見つけない。

**解決方法:**

1. **より広い検索語を試す:**
   ```bash
   function-indexer search "auth"
   function-indexer search "user"
   ```

2. **インデックスが存在するかチェック:**
   ```bash
   ls -la .function-indexer/index.jsonl
   ```

3. **インデックスを再生成:**
   ```bash
   rm .function-indexer/index.jsonl
   function-indexer
   ```

4. **異なる検索戦略を使用:**
   ```bash
   function-indexer search "authenticate" --context "login"
   function-indexer search "function" --limit 50
   ```

</details>

<details>
<summary><strong>❌ "Search results are not relevant"</strong></summary>

**問題:** 検索が関連性のない関数を返す。

**解決方法:**

1. **より具体的な用語を使用:**
   ```bash
   # "data"の代わりに
   function-indexer search "user data validation"
   ```

2. **コンテキストを追加:**
   ```bash
   function-indexer search "process" --context "payment"
   ```

3. **関数名を使用:**
   ```bash
   function-indexer search "authenticateUser"
   ```

</details>

## 🚀 CI/CD問題

<details>
<summary><strong>❌ "Function Indexer fails in CI environment"</strong></summary>

**問題:** ローカルでは動作するがCI/CDパイプラインで失敗する。

**解決方法:**

1. **Node.jsバージョンをチェック:**
   ```yaml
   # GitHub Actions
   - uses: actions/setup-node@v3
     with:
       node-version: '18'  # Function Indexerには16+を使用
   ```

2. **依存関係をインストール:**
   ```yaml
   - name: Function Indexerをインストール
     run: npm install -g github:akiramei/function-indexer
   ```

3. **ファイル権限をチェック:**
   ```bash
   ls -la .function-indexer/
   chmod 755 .function-indexer/
   ```

4. **特定の作業ディレクトリを使用:**
   ```yaml
   - name: コードを解析
     working-directory: ./src
     run: function-indexer
   ```

</details>

## 🐛 問題の報告

これらの解決方法でも問題が解決しない場合は、Function Indexerの改善にご協力ください：

### 報告前の確認
1. **最新バージョンに更新:**
   ```bash
   npm update -g function-indexer
   function-indexer --version
   ```

2. **詳細出力で実行:**
   ```bash
   function-indexer --verbose > debug.log 2>&1
   ```

3. **システム情報を収集:**
   ```bash
   node --version
   npm --version
   uname -a  # またはWindowsではsysteminfo
   ```

### 報告方法
1. [GitHub Issues](https://github.com/akiramei/function-indexer/issues)に移動
2. 既存の類似問題を検索
3. 新しいIssueを作成して以下を含める：
   - Function Indexerバージョン
   - Node.jsバージョン
   - オペレーティングシステム
   - プロジェクトタイプ
   - 詳細出力
   - 再現手順

### Issueテンプレート
```markdown
**Function Indexerバージョン:** 1.0.0
**Node.jsバージョン:** 18.17.0
**OS:** macOS 13.4
**プロジェクトタイプ:** React TypeScript

**問題の説明:**
問題の簡潔な説明

**再現手順:**
1. `function-indexer`を実行
2. エラーを確認...

**期待される動作:**
何が起こるべきだったか

**実際の動作:**
実際に何が起こったか

**詳細出力:**
```
[詳細出力をここに貼り付け]
```

**追加のコンテキスト:**
その他の関連情報
```

## 💬 ヘルプを得る

- 📖 **ドキュメント**: [完全ドキュメント](README-ja.md)をチェック
- 💭 **ディスカッション**: [GitHub Discussions](https://github.com/akiramei/function-indexer/discussions)に参加
- 🐛 **バグレポート**: [GitHub](https://github.com/akiramei/function-indexer/issues)でIssueを登録
- 📧 **連絡**: メンテナーに連絡

---

**🔧 まだ問題がありますか？** 私たちがお手伝いします！遠慮なくお声がけください。