# 🔧 高度な使用法とエンタープライズパターン

## 🌐 Language Selection / 言語選択

[English](ADVANCED-USAGE.md) | **日本語**（ここ）

> **エンタープライズグレードのワークフロー** - CI/CD統合、チームコラボレーション、高度な分析パターン

## 📖 概要

このガイドでは、エンタープライズ環境でのFunction Indexerの高度な使用パターンを説明します：

1. [**🚀 CI/CD統合**](#-cicd統合) - 自動品質ゲートとワークフロー
2. [**👥 チームコラボレーション**](#-チームコラボレーション) - 複数開発者のワークフロー
3. [**📊 エンタープライズメトリクス**](#-エンタープライズメトリクス) - 高度な品質追跡
4. [**🎯 カスタムワークフロー**](#-カスタムワークフロー) - 特殊な分析パターン
5. [**⚡ パフォーマンス最適化**](#-パフォーマンス最適化) - 大規模コードベースの処理

---

## 🚀 CI/CD統合

### GitHub Actions

#### 完全な品質パイプライン
`.github/workflows/code-quality.yml`を作成：

```yaml
name: コード品質分析

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    name: コード品質を分析
    
    steps:
      - name: コードをチェックアウト
        uses: actions/checkout@v4
        
      - name: Node.jsをセットアップ
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: 依存関係をインストール
        run: npm ci
        
      - name: ビルドツールをインストール
        run: |
          sudo apt-get update
          sudo apt-get install -y build-essential python3-dev
        
      - name: 関数インデックスを生成
        run: npx github:akiramei/function-indexer --root ./src --output functions.jsonl
        
      - name: メトリクスを収集
        run: npx github:akiramei/function-indexer metrics collect --root ./src --pr ${{ github.event.number }}
        
      - name: 品質ゲートをチェック
        run: |
          npx github:akiramei/function-indexer metrics trends --format json > violations.json
          if [ -s violations.json ]; then
            echo "::error::コード品質違反が検出されました"
            npx github:akiramei/function-indexer metrics trends
            exit 1
          fi
          
      - name: 関数インデックスをアップロード
        uses: actions/upload-artifact@v4
        with:
          name: function-analysis
          path: |
            functions.jsonl
            violations.json
          retention-days: 7
        
      - name: PRにコメント
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            if (fs.existsSync('violations.json') && fs.statSync('violations.json').size > 0) {
              const violations = JSON.parse(fs.readFileSync('violations.json', 'utf8'));
              const comment = `## 🔍 コード品質分析\n\n⚠️ **${violations.length}個の品質違反が検出されました:**\n\n${violations.map(v => `- ${v.function}: ${v.violation} (${v.value}/${v.threshold})`).join('\n')}`;
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }
```

#### 定期品質レポート
`.github/workflows/weekly-quality-report.yml`を作成：

```yaml
name: 週次品質レポート

on:
  schedule:
    - cron: '0 9 * * 1'  # 毎週月曜日 9:00 UTC
  workflow_dispatch:

jobs:
  quality-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: ツールをインストール
        run: |
          sudo apt-get update && sudo apt-get install -y build-essential python3-dev
          
      - name: 包括的なレポートを生成
        run: |
          npx github:akiramei/function-indexer --root ./src --output weekly-functions.jsonl
          npx github:akiramei/function-indexer metrics collect --root ./src
          npx github:akiramei/function-indexer metrics trends --since "1 week ago" > quality-report.md
          
      - name: レポートでissueを作成
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('quality-report.md', 'utf8');
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `週次品質レポート - ${new Date().toISOString().split('T')[0]}`,
              body: `## 📊 週次コード品質レポート\n\n${report}\n\n*Function Indexerによって自動生成*`
            });
```

### GitLab CI

#### 完全なパイプライン設定
`.gitlab-ci.yml`に追加：

```yaml
stages:
  - quality-check
  - deploy

variables:
  NODE_VERSION: "20"

code-quality:
  stage: quality-check
  image: node:${NODE_VERSION}
  before_script:
    - apt-get update && apt-get install -y build-essential python3-dev
    - npm ci
  script:
    - npx github:akiramei/function-indexer --root ./src --output functions.jsonl
    - npx github:akiramei/function-indexer metrics collect --root ./src --pr $CI_MERGE_REQUEST_IID
    - npx github:akiramei/function-indexer metrics trends --format json > violations.json
    - |
      if [ -s violations.json ]; then
        echo "コード品質違反が検出されました:"
        npx github:akiramei/function-indexer metrics trends
        exit 1
      fi
  artifacts:
    reports:
      junit: quality-report.xml
    paths:
      - functions.jsonl
      - violations.json
    expire_in: 1 week
  only:
    - merge_requests
    - main
```

### Jenkins

#### パイプライン設定
`Jenkinsfile`を作成：

```groovy
pipeline {
    agent any
    
    tools {
        nodejs '20'
    }
    
    environment {
        NODE_OPTIONS = '--max-old-space-size=4096'
    }
    
    stages {
        stage('セットアップ') {
            steps {
                sh 'npm ci'
                sh 'apt-get update && apt-get install -y build-essential python3-dev'
            }
        }
        
        stage('コード品質分析') {
            steps {
                sh 'npx github:akiramei/function-indexer --root ./src --output functions.jsonl'
                sh 'npx github:akiramei/function-indexer metrics collect --root ./src --pr ${env.CHANGE_ID}'
                
                script {
                    def violations = sh(
                        script: 'npx github:akiramei/function-indexer metrics trends --format json',
                        returnStdout: true
                    ).trim()
                    
                    if (violations) {
                        error "コード品質違反が検出されました: ${violations}"
                    }
                }
            }
            
            post {
                always {
                    archiveArtifacts artifacts: '*.jsonl', fingerprint: true
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '.',
                        reportFiles: 'quality-report.html',
                        reportName: '品質レポート'
                    ])
                }
            }
        }
    }
}
```

---

## 👥 チームコラボレーション

### ブランチベースの品質追跡

#### フィーチャーブランチワークフロー
```bash
#!/bin/bash
# scripts/feature-start.sh

BRANCH_NAME=$1
if [ -z "$BRANCH_NAME" ]; then
    echo "使用法: $0 <ブランチ名>"
    exit 1
fi

# ブランチを作成してベースラインを確立
git checkout -b $BRANCH_NAME
fx metrics collect --root ./src --branch $BRANCH_NAME --note "ベースライン"

echo "✅ フィーチャーブランチ '$BRANCH_NAME' を品質ベースラインで作成しました"
echo "🎯 'fx metrics collect --branch $BRANCH_NAME' を使用して変更を追跡してください"
```

#### マージ前品質ゲート
```bash
#!/bin/bash
# scripts/pre-merge-check.sh

BRANCH_NAME=$(git branch --show-current)
TARGET_BRANCH=${1:-main}

echo "🔍 マージ前品質チェック: $BRANCH_NAME → $TARGET_BRANCH"

# 現在のメトリクスを収集
fx metrics collect --root ./src --branch $BRANCH_NAME

# ターゲットブランチと比較
git checkout $TARGET_BRANCH
fx metrics collect --root ./src --branch $TARGET_BRANCH
git checkout $BRANCH_NAME

# 比較レポートを生成
fx metrics compare --branch $BRANCH_NAME --target $TARGET_BRANCH > comparison.md

# 違反をチェック
if fx metrics trends --branch $BRANCH_NAME --violations-only | grep -q "違反"; then
    echo "❌ 品質違反が検出されました - マージがブロックされました"
    fx metrics trends --branch $BRANCH_NAME --violations-only
    exit 1
fi

echo "✅ 品質チェック合格 - マージ準備完了"
```

### コードレビュー統合

#### レビュー準備スクリプト
```bash
#!/bin/bash
# scripts/prepare-review.sh

PR_NUMBER=$1
if [ -z "$PR_NUMBER" ]; then
    echo "使用法: $0 <PR番号>"
    exit 1
fi

echo "📊 PR #$PR_NUMBER のコードレビューデータを準備中"

# 包括的なメトリクスを収集
fx metrics collect --root ./src --pr $PR_NUMBER --verbose

# レビューインサイトを生成
echo "## 🔍 PR #$PR_NUMBER のコード品質分析" > review-notes.md
echo "" >> review-notes.md

# 変更された関数
echo "### 変更された関数:" >> review-notes.md
fx metrics pr $PR_NUMBER --format markdown >> review-notes.md

# 品質の懸念事項
echo "### 品質の懸念事項:" >> review-notes.md
fx metrics trends --pr $PR_NUMBER --format markdown >> review-notes.md

# 複雑度のホットスポット
echo "### 複雑度のホットスポット:" >> review-notes.md
fx ls --complexity ">10" --pr $PR_NUMBER --format markdown >> review-notes.md

# レビューする一般的なパターン
echo "### レビューする一般的なパターン:" >> review-notes.md
fx s "TODO" --context "review" --format markdown >> review-notes.md
fx s "FIXME" --context "urgent" --format markdown >> review-notes.md

echo "✅ レビューノートが生成されました: review-notes.md"
```

### チームメトリクスダッシュボード

#### 品質メトリクス収集
```bash
#!/bin/bash
# scripts/team-metrics.sh

TEAM_NAME=${1:-"development"}
OUTPUT_DIR="metrics-dashboard"

mkdir -p $OUTPUT_DIR

echo "📊 チームメトリクスを収集中: $TEAM_NAME"

# 個々の開発者メトリクス
for developer in $(git log --format='%aN' | sort -u); do
    echo "分析中: $developer のコミット"
    git log --author="$developer" --since="1 month ago" --format="%H" | \
    while read commit; do
        git checkout $commit
        fx metrics collect --root ./src --author "$developer" --commit $commit
    done
done

# チームダッシュボードを生成
fx metrics dashboard --team $TEAM_NAME --output $OUTPUT_DIR/dashboard.html

echo "✅ チームダッシュボードが生成されました: $OUTPUT_DIR/dashboard.html"
```

---

## 📊 エンタープライズメトリクス

### カスタムしきい値設定

#### 部門固有の標準
```json
// .function-indexer/enterprise-config.json
{
  "departments": {
    "backend": {
      "thresholds": {
        "cyclomaticComplexity": 8,
        "cognitiveComplexity": 12,
        "linesOfCode": 40,
        "nestingDepth": 3,
        "parameterCount": 3
      }
    },
    "frontend": {
      "thresholds": {
        "cyclomaticComplexity": 12,
        "cognitiveComplexity": 15,
        "linesOfCode": 60,
        "nestingDepth": 4,
        "parameterCount": 5
      }
    },
    "api": {
      "thresholds": {
        "cyclomaticComplexity": 6,
        "cognitiveComplexity": 10,
        "linesOfCode": 30,
        "nestingDepth": 2,
        "parameterCount": 4
      }
    }
  }
}
```

#### マルチドメイン分析
```bash
#!/bin/bash
# scripts/enterprise-analysis.sh

# 適切なしきい値で異なるドメインを分析
fx --root ./backend --domain api --config ./configs/api-config.json
fx --root ./frontend --domain ui --config ./configs/ui-config.json
fx --root ./shared --domain shared --config ./configs/shared-config.json

# 各ドメインのメトリクスを収集
fx metrics collect --root ./backend --domain api --config ./configs/api-config.json
fx metrics collect --root ./frontend --domain ui --config ./configs/ui-config.json
fx metrics collect --root ./shared --domain shared --config ./configs/shared-config.json

# エンタープライズレポートを生成
fx metrics enterprise-report --output enterprise-quality.html
```

### 時間経過での品質追跡

#### 履歴分析
```bash
#!/bin/bash
# scripts/historical-analysis.sh

MONTHS_BACK=${1:-6}
OUTPUT_FILE="historical-analysis.json"

echo "📈 $MONTHS_BACK ヶ月間の品質トレンドを分析中"

# 履歴データを収集
for i in $(seq 0 $MONTHS_BACK); do
    DATE=$(date -d "$i months ago" +%Y-%m-01)
    COMMIT=$(git rev-list -n 1 --before="$DATE" main)
    
    if [ -n "$COMMIT" ]; then
        echo "コミットを分析中: $COMMIT ($DATE)"
        git checkout $COMMIT
        fx metrics collect --root ./src --date "$DATE" --commit "$COMMIT"
    fi
done

git checkout main

# トレンド分析を生成
fx metrics trends --historical --since "$MONTHS_BACK months ago" --output $OUTPUT_FILE

echo "✅ 履歴分析が完了しました: $OUTPUT_FILE"
```

---

## 🎯 カスタムワークフロー

### セキュリティ重視の分析

#### セキュリティパターン検出
```bash
#!/bin/bash
# scripts/security-analysis.sh

echo "🔒 セキュリティ重視のコード分析"

# セキュリティ関連パターンを検索
echo "## 認証関数:" > security-report.md
fx s "auth" --context "security" --format markdown >> security-report.md

echo "## 入力検証:" >> security-report.md
fx s "validate" --context "input" --format markdown >> security-report.md

echo "## データサニタイゼーション:" >> security-report.md
fx s "sanitize" --context "xss sql" --format markdown >> security-report.md

echo "## 暗号化/復号化:" >> security-report.md
fx s "encrypt decrypt" --context "crypto" --format markdown >> security-report.md

echo "## エラー処理:" >> security-report.md
fx s "error" --context "handling security" --format markdown >> security-report.md

# 高複雑度のセキュリティ関数をチェック
echo "## 高複雑度のセキュリティ関数:" >> security-report.md
fx ls --complexity ">8" --pattern "*auth*" --format markdown >> security-report.md
fx ls --complexity ">8" --pattern "*security*" --format markdown >> security-report.md

echo "✅ セキュリティ分析が完了しました: security-report.md"
```

### パフォーマンス分析

#### パフォーマンスホットスポット検出
```bash
#!/bin/bash
# scripts/performance-analysis.sh

echo "⚡ パフォーマンス重視の分析"

# パフォーマンス関連パターンを検索
echo "## 非同期/待機パターン:" > performance-report.md
fx s "async await" --context "performance" --format markdown >> performance-report.md

echo "## キャッシング関数:" >> performance-report.md
fx s "cache" --context "performance optimization" --format markdown >> performance-report.md

echo "## データベース操作:" >> performance-report.md
fx s "query select insert update" --context "database" --format markdown >> performance-report.md

echo "## バッチ処理:" >> performance-report.md
fx s "batch process" --context "performance" --format markdown >> performance-report.md

# 複雑な非同期関数を特定
echo "## 複雑な非同期関数:" >> performance-report.md
fx ls --async-only --complexity ">10" --format markdown >> performance-report.md

# 最適化が必要な大きな関数
echo "## 大きな関数（>40行）:" >> performance-report.md
fx ls --lines ">40" --format markdown >> performance-report.md

echo "✅ パフォーマンス分析が完了しました: performance-report.md"
```

### アーキテクチャ分析

#### アーキテクチャパターン検出
```bash
#!/bin/bash
# scripts/architecture-analysis.sh

echo "🏗️ アーキテクチャパターン分析"

# デザインパターン
echo "## デザインパターン:" > architecture-report.md
fx s "singleton factory observer strategy" --context "pattern" --format markdown >> architecture-report.md

echo "## サービス層:" >> architecture-report.md
fx search --pattern "*Service" --exported-only --format markdown >> architecture-report.md

echo "## コントローラー層:" >> architecture-report.md
fx search --pattern "*Controller" --exported-only --format markdown >> architecture-report.md

echo "## リポジトリパターン:" >> architecture-report.md
fx search --pattern "*Repository" --exported-only --format markdown >> architecture-report.md

echo "## ユーティリティ関数:" >> architecture-report.md
fx search --pattern "is* get* set* has*" --complexity "<3" --format markdown >> architecture-report.md

# 層の複雑度を分析
echo "## 層の複雑度分析:" >> architecture-report.md
fx metrics layer-analysis --output architecture-metrics.json
cat architecture-metrics.json >> architecture-report.md

echo "✅ アーキテクチャ分析が完了しました: architecture-report.md"
```

---

## ⚡ パフォーマンス最適化

### 大規模コードベース処理

#### 並列処理戦略
```bash
#!/bin/bash
# scripts/parallel-analysis.sh

CORES=$(nproc)
ROOT_DIR=${1:-"./src"}

echo "🚀 $CORES コアを使用した並列分析"

# 並列処理のためにディレクトリを分割
find $ROOT_DIR -type d \( -name "src" -o -name "lib" -o -name "components" \) | \
head -$CORES | \
xargs -I {} -P $CORES sh -c '
    DIR={}
    OUTPUT="functions-$(basename {}).jsonl"
    echo "処理中: $DIR → $OUTPUT"
    fx --root "$DIR" --output "$OUTPUT"
'

# 結果をマージ
echo "📊 結果をマージ中..."
cat functions-*.jsonl > combined-functions.jsonl
rm functions-*.jsonl

echo "✅ 並列分析が完了しました: combined-functions.jsonl"
```

#### メモリ最適化処理
```bash
#!/bin/bash
# scripts/memory-optimized.sh

ROOT_DIR=${1:-"./src"}
BATCH_SIZE=${2:-50}

echo "💾 メモリ最適化分析（バッチサイズ: $BATCH_SIZE）"

# ファイルをバッチで処理
find $ROOT_DIR \( -name "*.ts" -o -name "*.tsx" \) | \
split -l $BATCH_SIZE - batch-

for batch_file in batch-*; do
    echo "バッチを処理中: $batch_file"
    
    # 一時的なインクルードファイルを作成
    while read file; do
        echo "\"$file\""
    done < $batch_file > include-patterns.json
    
    # メモリ制限でバッチを処理
    NODE_OPTIONS="--max-old-space-size=2048" \
    fx --root $ROOT_DIR \
       --include-file include-patterns.json \
       --output "batch-$(basename $batch_file).jsonl"
    
    rm include-patterns.json
done

# バッチ結果をマージ
cat batch-*.jsonl > optimized-functions.jsonl
rm batch-* include-patterns.json

echo "✅ メモリ最適化分析が完了しました: optimized-functions.jsonl"
```

### 分散分析

#### マルチサーバー処理
```bash
#!/bin/bash
# scripts/distributed-analysis.sh

SERVERS=("server1" "server2" "server3")
PROJECT_PATH="/path/to/project"

echo "🌐 ${#SERVERS[@]} サーバーでの分散分析"

# サーバー間で作業を分散
for i in "${!SERVERS[@]}"; do
    server=${SERVERS[$i]}
    partition=$((i + 1))
    
    echo "分析を開始中: $server（パーティション $partition）"
    
    ssh $server "
        cd $PROJECT_PATH
        fx --root ./src \
           --partition $partition/${#SERVERS[@]} \
           --output functions-part-$partition.jsonl
    " &
done

# すべてのサーバーの完了を待つ
wait

# すべてのサーバーから結果を収集
for i in "${!SERVERS[@]}"; do
    server=${SERVERS[$i]}
    partition=$((i + 1))
    
    scp $server:$PROJECT_PATH/functions-part-$partition.jsonl ./
done

# 分散結果をマージ
cat functions-part-*.jsonl > distributed-functions.jsonl
rm functions-part-*.jsonl

echo "✅ 分散分析が完了しました: distributed-functions.jsonl"
```

---

## 🔧 カスタム統合

### データベース統合

#### データベースに結果を保存
```bash
#!/bin/bash
# scripts/database-integration.sh

DATABASE_URL=${DATABASE_URL:-"postgresql://user:pass@localhost/codebase"}

echo "💾 分析結果をデータベースに保存中"

# 分析を生成
fx --root ./src --output functions.jsonl

# JSONLをSQLに変換
python3 << 'EOF'
import json
import psycopg2
import sys

# データベースに接続
conn = psycopg2.connect(sys.argv[1])
cur = conn.cursor()

# テーブルが存在しない場合は作成
cur.execute("""
    CREATE TABLE IF NOT EXISTS function_analysis (
        id SERIAL PRIMARY KEY,
        file_path VARCHAR(255),
        function_name VARCHAR(255),
        signature TEXT,
        start_line INTEGER,
        end_line INTEGER,
        complexity INTEGER,
        lines_of_code INTEGER,
        exported BOOLEAN,
        async BOOLEAN,
        analyzed_at TIMESTAMP DEFAULT NOW()
    )
""")

# データを挿入
with open('functions.jsonl', 'r') as f:
    for line in f:
        data = json.loads(line)
        cur.execute("""
            INSERT INTO function_analysis 
            (file_path, function_name, signature, start_line, end_line, 
             complexity, lines_of_code, exported, async)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data['file'], data['identifier'], data['signature'],
            data['startLine'], data['endLine'], 
            data['metrics']['cyclomaticComplexity'],
            data['metrics']['linesOfCode'],
            data['exported'], data['async']
        ))

conn.commit()
conn.close()
print("✅ データがデータベースに保存されました")
EOF

echo "✅ データベース統合が完了しました"
```

### API統合

#### 関数分析のREST API
```javascript
// server/function-analysis-api.js
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// 分析エンドポイント
app.post('/api/analyze', async (req, res) => {
    const { rootPath, domain, options = {} } = req.body;
    
    try {
        const outputFile = `analysis-${Date.now()}.jsonl`;
        const command = `fx --root "${rootPath}" --output "${outputFile}" ${domain ? `--domain "${domain}"` : ''}`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            
            // 結果を読み取って返す
            const results = [];
            const content = fs.readFileSync(outputFile, 'utf8');
            content.split('\n').filter(line => line.trim()).forEach(line => {
                results.push(JSON.parse(line));
            });
            
            // クリーンアップ
            fs.unlinkSync(outputFile);
            
            res.json({
                success: true,
                functionsFound: results.length,
                results: results
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 検索エンドポイント
app.post('/api/search', async (req, res) => {
    const { query, context, rootPath } = req.body;
    
    try {
        const command = `fx s "${query}" ${context ? `--context "${context}"` : ''} ${rootPath ? `--root "${rootPath}"` : ''} --format json`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            
            const results = JSON.parse(stdout);
            res.json({
                success: true,
                query,
                context,
                results
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// メトリクスエンドポイント
app.get('/api/metrics/:projectPath', async (req, res) => {
    const { projectPath } = req.params;
    
    try {
        const command = `fx metrics --root "${projectPath}" --format json`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            
            const metrics = JSON.parse(stdout);
            res.json({
                success: true,
                projectPath,
                metrics
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`関数分析APIがポート${PORT}で実行中`);
});
```

---

## 📈 監視とアラート

### 品質劣化アラート

#### Slack統合
```bash
#!/bin/bash
# scripts/quality-alerts.sh

SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
QUALITY_THRESHOLD=${QUALITY_THRESHOLD:-10}

# 現在のメトリクスを収集
fx metrics collect --root ./src

# 違反をチェック
VIOLATIONS=$(fx metrics trends --violations-only --count)

if [ "$VIOLATIONS" -gt "$QUALITY_THRESHOLD" ]; then
    MESSAGE="🚨 *品質アラート*: $(basename $(pwd))で $VIOLATIONS 個のコード品質違反が検出されました"
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$MESSAGE\"}" \
        $SLACK_WEBHOOK_URL
    
    echo "🚨 品質アラートがSlackに送信されました"
    exit 1
fi

echo "✅ 品質は許容範囲内です"
```

#### メールレポート
```python
#!/usr/bin/env python3
# scripts/email-reports.py

import smtplib
import json
import subprocess
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

def generate_quality_report():
    """包括的な品質レポートを生成"""
    result = subprocess.run(['fx', 'metrics', 'trends', '--format', 'json'], 
                          capture_output=True, text=True)
    return json.loads(result.stdout) if result.stdout else {}

def send_email_report(report_data, recipients):
    """品質レポートをメールで送信"""
    msg = MIMEMultipart()
    msg['From'] = 'quality-bot@company.com'
    msg['To'] = ', '.join(recipients)
    msg['Subject'] = f'週次コード品質レポート - {datetime.now().strftime("%Y-%m-%d")}'
    
    # HTMLレポートを作成
    html_body = f"""
    <html>
    <body>
        <h2>📊 週次コード品質レポート</h2>
        <p><strong>レポート日:</strong> {datetime.now().strftime("%Y-%m-%d %H:%M")}</p>
        
        <h3>🎯 サマリー</h3>
        <ul>
            <li>合計関数数: {report_data.get('totalFunctions', 0)}</li>
            <li>品質違反: {len(report_data.get('violations', []))}</li>
            <li>平均複雑度: {report_data.get('averageComplexity', 0):.2f}</li>
        </ul>
        
        <h3>⚠️ トップ違反</h3>
        <ul>
    """
    
    for violation in report_data.get('violations', [])[:10]:
        html_body += f"<li>{violation['function']}: {violation['issue']}</li>"
    
    html_body += """
        </ul>
        
        <p><em>Function Indexerによって自動生成</em></p>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(html_body, 'html'))
    
    # メールを送信
    server = smtplib.SMTP('smtp.company.com', 587)
    server.starttls()
    server.login('quality-bot@company.com', 'password')
    server.send_message(msg)
    server.quit()

if __name__ == '__main__':
    report = generate_quality_report()
    recipients = ['team-lead@company.com', 'architect@company.com']
    send_email_report(report, recipients)
    print("✅ 週次品質レポートが送信されました")
```

---

## 🎯 まとめ

Function Indexerの高度な使用により、以下が可能になります：

### エンタープライズの利点
- **自動品質ゲート**：CI/CD統合による品質劣化の防止
- **チームコラボレーション**：開発チーム全体での標準化されたワークフロー
- **履歴追跡**：長期的な品質トレンド分析
- **カスタムワークフロー**：セキュリティ、パフォーマンス、アーキテクチャの特殊な分析

### スケーラビリティ機能
- **大規模コードベースサポート**：並列および分散処理
- **メモリ最適化**：リソース制限環境でのバッチ処理
- **API統合**：既存ツールとのカスタム統合
- **監視とアラート**：プロアクティブな品質管理

### ベストプラクティス
1. **シンプルに始める**：基本的なCI/CD統合から開始
2. **段階的にカスタマイズ**：必要に応じてエンタープライズ機能を追加
3. **継続的に監視**：自動品質追跡を設定
4. **効果的に協力**：チーム重視のワークフローを使用

より高度なパターンとカスタム統合については、[AI統合ガイド](AI-INTEGRATION-ja.md)と[コマンドリファレンス](COMMAND-REFERENCE-ja.md)を参照してください。

---

**エンタープライズ対応のコード品質管理** 🏢✨