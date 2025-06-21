# 🔗 統合例

> 開発ワークフローにFunction Indexerを統合するための実世界の例

## 🚀 CI/CD統合

### GitHub Actions

<details>
<summary><strong>📊 プルリクエストでのコード品質チェック</strong></summary>

`.github/workflows/code-quality.yml`を作成：

```yaml
name: コード品質解析

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    name: コード品質解析
    
    steps:
      - name: コードをチェックアウト
        uses: actions/checkout@v4
        
      - name: Node.jsをセットアップ
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: 依存関係をインストール
        run: npm ci
        
      - name: Function Indexerをインストール
        run: npm install -g function-indexer
        
      - name: 関数インデックスを生成
        run: function-indexer
        
      - name: コードメトリクスを解析
        id: metrics
        run: |
          echo "## 📊 コード品質レポート" >> $GITHUB_STEP_SUMMARY
          function-indexer metrics >> $GITHUB_STEP_SUMMARY
          
          # 高複雑度関数をチェック
          if function-indexer metrics | grep -q "High Risk"; then
            echo "high_complexity=true" >> $GITHUB_OUTPUT
            echo "⚠️ **高複雑度関数が検出されました！**" >> $GITHUB_STEP_SUMMARY
            function-indexer metrics --details >> $GITHUB_STEP_SUMMARY
          else
            echo "high_complexity=false" >> $GITHUB_OUTPUT
            echo "✅ **すべての関数が複雑度閾値内です**" >> $GITHUB_STEP_SUMMARY
          fi
          
      - name: PRにコメント
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const { execSync } = require('child_process');
            const metrics = execSync('function-indexer metrics', { encoding: 'utf8' });
            
            const comment = `## 📊 Function Indexer レポート
            
            ${metrics}
            
            <details>
            <summary>🔍 関数検索が利用可能</summary>
            
            解析された関数を検索できます：
            \`\`\`bash
            function-indexer search "your query"
            \`\`\`
            
            </details>
            
            *Function Indexerにより生成*`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
            
      - name: 高複雑度の場合失敗
        if: steps.metrics.outputs.high_complexity == 'true'
        run: |
          echo "::error::高複雑度関数が検出されました。マージ前にリファクタリングを検討してください。"
          exit 1
```

</details>

<details>
<summary><strong>📈 複雑度トレンド追跡</strong></summary>

時間経過による複雑度トレンドを追跡：

```yaml
name: 複雑度トレンド解析

on:
  push:
    branches: [main]

jobs:
  track-complexity:
    runs-on: ubuntu-latest
    
    steps:
      - name: コードをチェックアウト
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # トレンド解析のための完全履歴
          
      - name: Node.jsをセットアップ
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Function Indexerをインストール
        run: npm install -g function-indexer
        
      - name: メトリクスレポートを生成
        run: |
          function-indexer
          function-indexer metrics --details > complexity-report.txt
          
      - name: 複雑度レポートをアップロード
        uses: actions/upload-artifact@v4
        with:
          name: complexity-report-${{ github.sha }}
          path: complexity-report.txt
          
      - name: リポジトリにメトリクスを保存
        run: |
          mkdir -p .github/metrics
          echo "$(date): $(function-indexer metrics | grep 'Total Functions')" >> .github/metrics/history.log
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .github/metrics/history.log
          git commit -m "複雑度メトリクス更新 [skip ci]" || exit 0
          git push
```

</details>

### GitLab CI

<details>
<summary><strong>🦊 GitLabパイプライン統合</strong></summary>

`.gitlab-ci.yml`に追加：

```yaml
stages:
  - analyze
  - quality-gate

variables:
  NODE_VERSION: "18"

function-indexer:analyze:
  stage: analyze
  image: node:${NODE_VERSION}
  before_script:
    - npm install -g function-indexer
  script:
    - function-indexer
    - function-indexer metrics > metrics-report.txt
    - function-indexer metrics --details > detailed-metrics.txt
  artifacts:
    reports:
      junit: test-results.xml
    paths:
      - .function-indexer/
      - metrics-report.txt
      - detailed-metrics.txt
    expire_in: 1 week
  only:
    - merge_requests
    - main
    - develop

quality-gate:
  stage: quality-gate
  image: node:${NODE_VERSION}
  dependencies:
    - function-indexer:analyze
  script:
    - |
      if grep -q "High Risk" metrics-report.txt; then
        echo "❌ 品質ゲート失敗: 高複雑度関数が検出されました"
        cat detailed-metrics.txt
        exit 1
      else
        echo "✅ 品質ゲート通過: すべての関数が閾値内です"
      fi
  only:
    - merge_requests
    - main
```

</details>

### Azure DevOps

<details>
<summary><strong>🔷 Azure Pipelines</strong></summary>

`azure-pipelines.yml`を作成：

```yaml
trigger:
  - main
  - develop

pr:
  - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: $(nodeVersion)
  displayName: 'Node.jsをインストール'

- script: |
    npm install -g function-indexer
  displayName: 'Function Indexerをインストール'

- script: |
    function-indexer
    function-indexer metrics > $(Agent.TempDirectory)/metrics.txt
  displayName: 'コード品質を解析'

- script: |
    echo "##vso[task.uploadsummary]$(Agent.TempDirectory)/metrics.txt"
    
    if grep -q "High Risk" $(Agent.TempDirectory)/metrics.txt; then
      echo "##vso[task.logissue type=warning]高複雑度関数が検出されました"
      function-indexer metrics --details
    fi
  displayName: '結果を報告'

- task: PublishTestResults@2
  inputs:
    testResultsFiles: '$(Agent.TempDirectory)/metrics.txt'
    testRunTitle: 'Function Indexer メトリクス'
  condition: always()
```

</details>

## 🪝 Gitフック

### Pre-commitフック

<details>
<summary><strong>🔧 Husky + Function Indexer</strong></summary>

1. **Huskyをインストール:**
   ```bash
   npm install --save-dev husky
   npx husky install
   ```

2. **pre-commitフックを作成:**
   ```bash
   npx husky add .husky/pre-commit "npm run pre-commit"
   ```

3. **package.jsonに追加:**
   ```json
   {
     "scripts": {
       "pre-commit": "function-indexer && npm run check-complexity",
       "check-complexity": "function-indexer metrics | grep -q 'High Risk' && echo '⚠️ 高複雑度検出' || echo '✅ 複雑度OK'"
     }
   }
   ```

4. **高度なpre-commitスクリプト:**
   ```bash
   #!/bin/sh
   . "$(dirname "$0")/_/husky.sh"

   echo "🔍 Function Indexerでコードを解析中..."
   
   # 関数インデックスを更新
   function-indexer
   
   # 変更されたファイルの高複雑度をチェック
   changed_files=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx|js|jsx)$')
   
   if [ -n "$changed_files" ]; then
     echo "📊 変更されたファイルの複雑度をチェック中..."
     
     # 変更されたファイルに高複雑度があるかチェック
     for file in $changed_files; do
       if function-indexer search "$(basename "$file" .ts)" --limit 1 | grep -q "High complexity"; then
         echo "⚠️ $file で高複雑度が検出されました"
         echo "コミット前にリファクタリングを検討してください。"
         echo "詳細は 'function-indexer metrics --details' を実行してください。"
         exit 1
       fi
     done
     
     echo "✅ 変更されたファイルはすべて複雑度チェックに合格しました"
   fi
   
   # インデックスが変更された場合は更新
   if git diff --cached --quiet .function-indexer/; then
     echo "📝 更新された関数インデックスをコミットに追加"
     git add .function-indexer/
   fi
   ```

</details>

### Pre-pushフック

<details>
<summary><strong>🚀 Pre-push品質チェック</strong></summary>

`.husky/pre-push`を作成：

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🚀 push前品質チェックを実行中..."

# push前の完全解析
function-indexer

# 包括的レポートを生成
function-indexer metrics > /tmp/quality-report.txt

# 品質閾値をチェック
high_risk=$(grep "High Risk:" /tmp/quality-report.txt | grep -o "[0-9]\+")
total_functions=$(grep "Total Functions:" /tmp/quality-report.txt | grep -o "[0-9]\+")

if [ "$high_risk" -gt 0 ]; then
  echo "⚠️ 品質ゲートチェック:"
  echo "   高リスク関数: $high_risk"
  echo "   総関数数: $total_functions"
  echo "   リスク比率: $(echo "scale=2; $high_risk / $total_functions * 100" | bc)%"
  
  if [ "$(echo "$high_risk / $total_functions > 0.1" | bc)" -eq 1 ]; then
    echo "❌ 品質ゲート失敗: 高リスク関数が多すぎます (>10%)"
    echo "'function-indexer metrics --details' を実行して具体的な問題を確認してください"
    exit 1
  fi
fi

echo "✅ 品質ゲート通過"
```

</details>

## 🔄 開発ワークフロー

### VS Code統合

<details>
<summary><strong>📝 VS Codeタスク</strong></summary>

`.vscode/tasks.json`を作成：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Function Indexer: 解析",
      "type": "shell",
      "command": "function-indexer",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Function Indexer: メトリクス",
      "type": "shell",
      "command": "function-indexer metrics",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Function Indexer: 検索",
      "type": "shell",
      "command": "function-indexer search",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": true,
        "panel": "shared"
      },
      "problemMatcher": []
    }
  ]
}
```

デバッグ用の`.vscode/launch.json`を作成：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Function Indexerをデバッグ",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/function-indexer",
      "args": ["--verbose"],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

</details>

### Package.jsonスクリプト

<details>
<summary><strong>📦 NPMスクリプト統合</strong></summary>

`package.json`に追加：

```json
{
  "scripts": {
    "analyze": "function-indexer",
    "analyze:verbose": "function-indexer --verbose",
    "metrics": "function-indexer metrics",
    "metrics:details": "function-indexer metrics --details",
    "search": "function-indexer search",
    "quality:check": "function-indexer metrics | grep -q 'High Risk' && exit 1 || echo '✅ 品質OK'",
    "quality:report": "function-indexer metrics > quality-report.txt && cat quality-report.txt",
    "pre-commit": "npm run analyze && npm run quality:check",
    "pre-push": "npm run analyze && npm run quality:report"
  }
}
```

使用方法：
```bash
npm run analyze
npm run metrics
npm run search "authentication"
npm run quality:check
```

</details>

### Makefile統合

<details>
<summary><strong>🔨 Makefileコマンド</strong></summary>

`Makefile`を作成：

```makefile
.PHONY: analyze metrics search quality setup help

# デフォルトターゲット
help: ## このヘルプメッセージを表示
	@echo "Function Indexer Makeコマンド:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Function Indexerをインストール
	npm install -g function-indexer

analyze: ## 関数解析を実行
	@echo "🔍 コードベースを解析中..."
	function-indexer

metrics: ## コード品質メトリクスを表示
	@echo "📊 コード品質メトリクス:"
	function-indexer metrics

metrics-details: ## 詳細メトリクスを表示
	@echo "📊 詳細コード品質メトリクス:"
	function-indexer metrics --details

search: ## 関数を検索（使用法: make search QUERY="auth"）
	@echo "🔍 検索対象: $(QUERY)"
	function-indexer search "$(QUERY)"

quality-check: ## 品質閾値をチェック
	@echo "🎯 品質チェック:"
	@function-indexer metrics | grep -q "High Risk" && \
		(echo "❌ 品質チェック失敗" && exit 1) || \
		echo "✅ 品質チェック合格"

quality-report: ## 品質レポートを生成
	@echo "📄 品質レポートを生成中..."
	function-indexer metrics > quality-report.txt
	@cat quality-report.txt

ci-check: analyze quality-check ## CI品質チェックを実行

pre-commit: analyze quality-check ## pre-commitチェック

clean: ## Function Indexerデータをクリーン
	rm -rf .function-indexer
	rm -f quality-report.txt
```

使用方法：
```bash
make analyze
make metrics
make search QUERY="authentication"
make quality-check
```

</details>

## 📊 監視・レポート

### 品質ダッシュボード

<details>
<summary><strong>📈 自動品質レポート</strong></summary>

定期的な品質レポート生成スクリプトを作成：

```bash
#!/bin/bash
# quality-dashboard.sh

DATE=$(date +"%Y-%m-%d")
REPORT_DIR="quality-reports"
REPORT_FILE="$REPORT_DIR/quality-$DATE.md"

mkdir -p "$REPORT_DIR"

cat > "$REPORT_FILE" << EOF
# コード品質レポート - $DATE

## サマリー
$(function-indexer metrics)

## 詳細解析
$(function-indexer metrics --details)

## 複雑度上位関数
$(function-indexer search "function" --limit 10 | grep "High complexity")

## 検索例
\`\`\`bash
# 認証関数を検索
function-indexer search "auth"

# APIエンドポイントを検索
function-indexer search "api route"

# データベース操作を検索
function-indexer search "database query"
\`\`\`

---
*$DATE に生成*
EOF

echo "📊 品質レポートが生成されました: $REPORT_FILE"

# オプション: チームチャット（Slack、Discordなど）に送信
if [ -n "$SLACK_WEBHOOK" ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"📊 日次コード品質レポート: $DATE\n\`\`\`$(function-indexer metrics)\`\`\`\"}" \
    "$SLACK_WEBHOOK"
fi
```

日次レポート用にcrontabに追加：
```bash
# 毎日午前9時に実行
0 9 * * * /path/to/quality-dashboard.sh
```

</details>

### コードレビューとの統合

<details>
<summary><strong>🔍 コードレビューアシスタント</strong></summary>

レビュアー用スクリプトを作成：

```bash
#!/bin/bash
# review-helper.sh

echo "🔍 コードレビューアシスタント"
echo "======================="

# 現在のブランチで変更されたファイルを取得
changed_files=$(git diff main...HEAD --name-only | grep -E '\.(ts|tsx|js|jsx)$')

if [ -z "$changed_files" ]; then
  echo "TypeScript/JavaScriptファイルの変更はありません。"
  exit 0
fi

echo "📁 変更されたファイル:"
echo "$changed_files"
echo ""

# 現在の状態を解析
echo "📊 現在の品質メトリクス:"
function-indexer metrics
echo ""

# 変更されたファイルを個別チェック
echo "🔍 変更されたファイルの解析:"
for file in $changed_files; do
  if [ -f "$file" ]; then
    basename_file=$(basename "$file" | sed 's/\.[^.]*$//')
    echo "📄 $file:"
    function-indexer search "$basename_file" --limit 3
    echo ""
  fi
done

# 提案を提供
echo "💡 レビュー提案:"
echo "• 高複雑度関数をチェック"
echo "• より小さな関数への抽出機会を探す"
echo "• 新しい関数が命名規則に従っているか確認"
echo "• 複雑な関数への単体テスト追加を検討"
```

コードレビュー中の使用方法：
```bash
git checkout feature/new-auth
./review-helper.sh
```

</details>

## 🚀 高度な統合

### Docker統合

<details>
<summary><strong>🐳 コンテナ化解析</strong></summary>

`Dockerfile.analysis`を作成：

```dockerfile
FROM node:18-alpine

# Function Indexerをインストール
RUN npm install -g function-indexer

# 作業ディレクトリを設定
WORKDIR /app

# ソースコードをコピー
COPY . .

# 解析を実行
CMD ["sh", "-c", "function-indexer && function-indexer metrics"]
```

使用方法：
```bash
# 解析コンテナをビルド
docker build -f Dockerfile.analysis -t my-app-analysis .

# 解析を実行
docker run --rm -v $(pwd):/app my-app-analysis

# またはdocker-composeの一部として
```

`docker-compose.yml`に追加：
```yaml
version: '3.8'
services:
  app:
    build: .
    # ... あなたのアプリ設定
    
  code-analysis:
    build:
      context: .
      dockerfile: Dockerfile.analysis
    volumes:
      - .:/app
    command: |
      sh -c "
        function-indexer
        function-indexer metrics > /tmp/metrics.txt
        cat /tmp/metrics.txt
      "
```

</details>

### Slack/Discord通知

<details>
<summary><strong>💬 チーム通知</strong></summary>

通知スクリプトを作成：

```bash
#!/bin/bash
# notify-team.sh

WEBHOOK_URL="YOUR_SLACK_WEBHOOK_URL"
PROJECT_NAME="My Awesome Project"

# メトリクスを生成
metrics=$(function-indexer metrics)
high_risk=$(echo "$metrics" | grep "High Risk:" | grep -o "[0-9]\+")

# メッセージの色を決定
if [ "$high_risk" -gt 0 ]; then
  color="warning"
  emoji="⚠️"
else
  color="good"
  emoji="✅"
fi

# Slackに送信
curl -X POST -H 'Content-type: application/json' \
  --data "{
    \"attachments\": [
      {
        \"color\": \"$color\",
        \"title\": \"$emoji コード品質レポート - $PROJECT_NAME\",
        \"text\": \"\`\`\`$metrics\`\`\`\",
        \"footer\": \"Function Indexer\",
        \"ts\": $(date +%s)
      }
    ]
  }" \
  "$WEBHOOK_URL"
```

Discord用：
```bash
#!/bin/bash
# discord-notify.sh

DISCORD_WEBHOOK="YOUR_DISCORD_WEBHOOK"
metrics=$(function-indexer metrics)

curl -H "Content-Type: application/json" \
  -d "{
    \"embeds\": [
      {
        \"title\": \"📊 コード品質レポート\",
        \"description\": \"\`\`\`$metrics\`\`\`\",
        \"color\": 5814783,
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
      }
    ]
  }" \
  "$DISCORD_WEBHOOK"
```

</details>

---

## 🎯 ベストプラクティス

1. **シンプルに始める**: 基本的なCI統合から始めて、徐々に複雑にする
2. **段階的導入**: ワークフローを破綻させないよう品質ゲートを段階的に導入
3. **チーム研修**: チームがメトリクスと閾値を理解するようにする
4. **定期レビュー**: ワークフローの進化に合わせて品質閾値を定期的に見直し・調整
5. **ドキュメント化**: ワークフローの進化に合わせて統合ドキュメントを最新に保つ

## 📞 ヘルプが必要？

- 📖 [トラブルシューティングガイド](TROUBLESHOOTING-ja.md)をチェック
- 💬 [GitHub Discussions](https://github.com/akiramei/function-indexer/discussions)に参加
- 🐛 統合の問題を[GitHub](https://github.com/akiramei/function-indexer/issues)で報告

---

**🚀 統合準備はできましたか？** あなたのチームのセットアップに合うワークフローを選んで、今日からコード品質の改善を始めましょう！