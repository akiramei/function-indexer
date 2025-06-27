# 🔧 Advanced Usage & Enterprise Patterns

## 🌐 Language Selection / 言語選択

**English** (you are here) | [日本語](ADVANCED-USAGE-ja.md)

> **Enterprise-grade workflows** - CI/CD integration, team collaboration, and advanced analysis patterns

## 📖 Overview

This guide covers advanced usage patterns for Function Indexer in enterprise environments:

1. [**🚀 CI/CD Integration**](#-cicd-integration) - Automated quality gates and workflows
2. [**👥 Team Collaboration**](#-team-collaboration) - Multi-developer workflows
3. [**📊 Enterprise Metrics**](#-enterprise-metrics) - Advanced quality tracking
4. [**🎯 Custom Workflows**](#-custom-workflows) - Specialized analysis patterns
5. [**⚡ Performance Optimization**](#-performance-optimization) - Large codebase handling

---

## 🚀 CI/CD Integration

### GitHub Actions

#### Complete Quality Pipeline
Create `.github/workflows/code-quality.yml`:

```yaml
name: Code Quality Analysis

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    name: Analyze Code Quality
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install build tools
        run: |
          sudo apt-get update
          sudo apt-get install -y build-essential python3-dev
        
      - name: Generate function index
        run: npx github:akiramei/function-indexer --root ./src --output functions.jsonl
        
      - name: Collect metrics
        run: npx github:akiramei/function-indexer metrics collect --root ./src --pr ${{ github.event.number }}
        
      - name: Check quality gates
        run: |
          npx github:akiramei/function-indexer metrics trends --format json > violations.json
          if [ -s violations.json ]; then
            echo "::error::Code quality violations detected"
            npx github:akiramei/function-indexer metrics trends
            exit 1
          fi
          
      - name: Upload function index
        uses: actions/upload-artifact@v4
        with:
          name: function-analysis
          path: |
            functions.jsonl
            violations.json
          retention-days: 7
        
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            if (fs.existsSync('violations.json') && fs.statSync('violations.json').size > 0) {
              const violations = JSON.parse(fs.readFileSync('violations.json', 'utf8'));
              const comment = `## 🔍 Code Quality Analysis\n\n⚠️ **${violations.length} quality violations detected:**\n\n${violations.map(v => `- ${v.function}: ${v.violation} (${v.value}/${v.threshold})`).join('\n')}`;
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }
```

#### Scheduled Quality Reports
Create `.github/workflows/weekly-quality-report.yml`:

```yaml
name: Weekly Quality Report

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
  workflow_dispatch:

jobs:
  quality-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install tools
        run: |
          sudo apt-get update && sudo apt-get install -y build-essential python3-dev
          
      - name: Generate comprehensive report
        run: |
          npx github:akiramei/function-indexer --root ./src --output weekly-functions.jsonl
          npx github:akiramei/function-indexer metrics collect --root ./src
          npx github:akiramei/function-indexer metrics trends --since "1 week ago" > quality-report.md
          
      - name: Create issue with report
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('quality-report.md', 'utf8');
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Weekly Quality Report - ${new Date().toISOString().split('T')[0]}`,
              body: `## 📊 Weekly Code Quality Report\n\n${report}\n\n*Generated automatically by Function Indexer*`
            });
```

### GitLab CI

#### Complete Pipeline Configuration
Add to `.gitlab-ci.yml`:

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
        echo "Code quality violations detected:"
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

#### Pipeline Configuration
Create `Jenkinsfile`:

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
        stage('Setup') {
            steps {
                sh 'npm ci'
                sh 'apt-get update && apt-get install -y build-essential python3-dev'
            }
        }
        
        stage('Code Quality Analysis') {
            steps {
                sh 'npx github:akiramei/function-indexer --root ./src --output functions.jsonl'
                sh 'npx github:akiramei/function-indexer metrics collect --root ./src --pr ${env.CHANGE_ID}'
                
                script {
                    def violations = sh(
                        script: 'npx github:akiramei/function-indexer metrics trends --format json',
                        returnStdout: true
                    ).trim()
                    
                    if (violations) {
                        error "Code quality violations detected: ${violations}"
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
                        reportName: 'Quality Report'
                    ])
                }
            }
        }
    }
}
```

---

## 👥 Team Collaboration

### Branch-based Quality Tracking

#### Feature Branch Workflow
```bash
#!/bin/bash
# scripts/feature-start.sh

BRANCH_NAME=$1
if [ -z "$BRANCH_NAME" ]; then
    echo "Usage: $0 <branch-name>"
    exit 1
fi

# Create branch and establish baseline
git checkout -b $BRANCH_NAME
fx metrics collect --root ./src --branch $BRANCH_NAME --note "baseline"

echo "✅ Feature branch '$BRANCH_NAME' created with quality baseline"
echo "🎯 Use 'fx metrics collect --branch $BRANCH_NAME' to track changes"
```

#### Pre-merge Quality Gate
```bash
#!/bin/bash
# scripts/pre-merge-check.sh

BRANCH_NAME=$(git branch --show-current)
TARGET_BRANCH=${1:-main}

echo "🔍 Pre-merge quality check: $BRANCH_NAME → $TARGET_BRANCH"

# Collect current metrics
fx metrics collect --root ./src --branch $BRANCH_NAME

# Compare with target branch
git checkout $TARGET_BRANCH
fx metrics collect --root ./src --branch $TARGET_BRANCH
git checkout $BRANCH_NAME

# Generate comparison report
fx metrics compare --branch $BRANCH_NAME --target $TARGET_BRANCH > comparison.md

# Check for violations
if fx metrics trends --branch $BRANCH_NAME --violations-only | grep -q "violation"; then
    echo "❌ Quality violations detected - merge blocked"
    fx metrics trends --branch $BRANCH_NAME --violations-only
    exit 1
fi

echo "✅ Quality check passed - ready for merge"
```

### Code Review Integration

#### Review Preparation Script
```bash
#!/bin/bash
# scripts/prepare-review.sh

PR_NUMBER=$1
if [ -z "$PR_NUMBER" ]; then
    echo "Usage: $0 <pr-number>"
    exit 1
fi

echo "📊 Preparing code review data for PR #$PR_NUMBER"

# Collect comprehensive metrics
fx metrics collect --root ./src --pr $PR_NUMBER --verbose

# Generate review insights
echo "## 🔍 Code Quality Analysis for PR #$PR_NUMBER" > review-notes.md
echo "" >> review-notes.md

# Functions changed
echo "### Functions Modified:" >> review-notes.md
fx metrics pr $PR_NUMBER --format markdown >> review-notes.md

# Quality violations
echo "### Quality Concerns:" >> review-notes.md
fx metrics trends --pr $PR_NUMBER --format markdown >> review-notes.md

# Complexity hotspots
echo "### Complexity Hotspots:" >> review-notes.md
fx ls --complexity ">10" --pr $PR_NUMBER --format markdown >> review-notes.md

# Search patterns for common issues
echo "### Common Patterns to Review:" >> review-notes.md
fx s "TODO" --context "review" --format markdown >> review-notes.md
fx s "FIXME" --context "urgent" --format markdown >> review-notes.md

echo "✅ Review notes generated: review-notes.md"
```

### Team Metrics Dashboard

#### Quality Metrics Collection
```bash
#!/bin/bash
# scripts/team-metrics.sh

TEAM_NAME=${1:-"development"}
OUTPUT_DIR="metrics-dashboard"

mkdir -p $OUTPUT_DIR

echo "📊 Collecting team metrics for: $TEAM_NAME"

# Individual developer metrics
for developer in $(git log --format='%aN' | sort -u); do
    echo "Analyzing commits by: $developer"
    git log --author="$developer" --since="1 month ago" --format="%H" | \
    while read commit; do
        git checkout $commit
        fx metrics collect --root ./src --author "$developer" --commit $commit
    done
done

# Generate team dashboard
fx metrics dashboard --team $TEAM_NAME --output $OUTPUT_DIR/dashboard.html

echo "✅ Team dashboard generated: $OUTPUT_DIR/dashboard.html"
```

---

## 📊 Enterprise Metrics

### Custom Threshold Configuration

#### Department-specific Standards
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

#### Multi-domain Analysis
```bash
#!/bin/bash
# scripts/enterprise-analysis.sh

# Analyze different domains with appropriate thresholds
fx --root ./backend --domain api --config ./configs/api-config.json
fx --root ./frontend --domain ui --config ./configs/ui-config.json
fx --root ./shared --domain shared --config ./configs/shared-config.json

# Collect metrics for each domain
fx metrics collect --root ./backend --domain api --config ./configs/api-config.json
fx metrics collect --root ./frontend --domain ui --config ./configs/ui-config.json
fx metrics collect --root ./shared --domain shared --config ./configs/shared-config.json

# Generate enterprise report
fx metrics enterprise-report --output enterprise-quality.html
```

### Quality Tracking Over Time

#### Historical Analysis
```bash
#!/bin/bash
# scripts/historical-analysis.sh

MONTHS_BACK=${1:-6}
OUTPUT_FILE="historical-analysis.json"

echo "📈 Analyzing quality trends over $MONTHS_BACK months"

# Collect historical data
for i in $(seq 0 $MONTHS_BACK); do
    DATE=$(date -d "$i months ago" +%Y-%m-01)
    COMMIT=$(git rev-list -n 1 --before="$DATE" main)
    
    if [ -n "$COMMIT" ]; then
        echo "Analyzing commit: $COMMIT ($DATE)"
        git checkout $COMMIT
        fx metrics collect --root ./src --date "$DATE" --commit "$COMMIT"
    fi
done

git checkout main

# Generate trend analysis
fx metrics trends --historical --since "$MONTHS_BACK months ago" --output $OUTPUT_FILE

echo "✅ Historical analysis completed: $OUTPUT_FILE"
```

---

## 🎯 Custom Workflows

### Security-Focused Analysis

#### Security Pattern Detection
```bash
#!/bin/bash
# scripts/security-analysis.sh

echo "🔒 Security-focused code analysis"

# Search for security-related patterns
echo "## Authentication Functions:" > security-report.md
fx s "auth" --context "security" --format markdown >> security-report.md

echo "## Input Validation:" >> security-report.md
fx s "validate" --context "input" --format markdown >> security-report.md

echo "## Data Sanitization:" >> security-report.md
fx s "sanitize" --context "xss sql" --format markdown >> security-report.md

echo "## Encryption/Decryption:" >> security-report.md
fx s "encrypt decrypt" --context "crypto" --format markdown >> security-report.md

echo "## Error Handling:" >> security-report.md
fx s "error" --context "handling security" --format markdown >> security-report.md

# Check for high-complexity security functions
echo "## High-Complexity Security Functions:" >> security-report.md
fx ls --complexity ">8" --pattern "*auth*" --format markdown >> security-report.md
fx ls --complexity ">8" --pattern "*security*" --format markdown >> security-report.md

echo "✅ Security analysis completed: security-report.md"
```

### Performance Analysis

#### Performance Hotspot Detection
```bash
#!/bin/bash
# scripts/performance-analysis.sh

echo "⚡ Performance-focused analysis"

# Search for performance-related patterns
echo "## Async/Await Patterns:" > performance-report.md
fx s "async await" --context "performance" --format markdown >> performance-report.md

echo "## Caching Functions:" >> performance-report.md
fx s "cache" --context "performance optimization" --format markdown >> performance-report.md

echo "## Database Operations:" >> performance-report.md
fx s "query select insert update" --context "database" --format markdown >> performance-report.md

echo "## Batch Processing:" >> performance-report.md
fx s "batch process" --context "performance" --format markdown >> performance-report.md

# Identify complex async functions
echo "## Complex Async Functions:" >> performance-report.md
fx ls --async-only --complexity ">10" --format markdown >> performance-report.md

# Large functions that might need optimization
echo "## Large Functions (>40 lines):" >> performance-report.md
fx ls --lines ">40" --format markdown >> performance-report.md

echo "✅ Performance analysis completed: performance-report.md"
```

### Architecture Analysis

#### Architecture Pattern Detection
```bash
#!/bin/bash
# scripts/architecture-analysis.sh

echo "🏗️ Architecture pattern analysis"

# Design patterns
echo "## Design Patterns:" > architecture-report.md
fx s "singleton factory observer strategy" --context "pattern" --format markdown >> architecture-report.md

echo "## Service Layer:" >> architecture-report.md
fx search --pattern "*Service" --exported-only --format markdown >> architecture-report.md

echo "## Controller Layer:" >> architecture-report.md
fx search --pattern "*Controller" --exported-only --format markdown >> architecture-report.md

echo "## Repository Pattern:" >> architecture-report.md
fx search --pattern "*Repository" --exported-only --format markdown >> architecture-report.md

echo "## Utility Functions:" >> architecture-report.md
fx search --pattern "is* get* set* has*" --complexity "<3" --format markdown >> architecture-report.md

# Analyze layer complexity
echo "## Layer Complexity Analysis:" >> architecture-report.md
fx metrics layer-analysis --output architecture-metrics.json
cat architecture-metrics.json >> architecture-report.md

echo "✅ Architecture analysis completed: architecture-report.md"
```

---

## ⚡ Performance Optimization

### Large Codebase Handling

#### Parallel Processing Strategy
```bash
#!/bin/bash
# scripts/parallel-analysis.sh

CORES=$(nproc)
ROOT_DIR=${1:-"./src"}

echo "🚀 Parallel analysis using $CORES cores"

# Split directories for parallel processing
find $ROOT_DIR -type d -name "src" -o -name "lib" -o -name "components" | \
head -$CORES | \
xargs -I {} -P $CORES sh -c '
    DIR={}
    OUTPUT="functions-$(basename {}).jsonl"
    echo "Processing: $DIR → $OUTPUT"
    fx --root "$DIR" --output "$OUTPUT"
'

# Merge results
echo "📊 Merging results..."
cat functions-*.jsonl > combined-functions.jsonl
rm functions-*.jsonl

echo "✅ Parallel analysis completed: combined-functions.jsonl"
```

#### Memory-Optimized Processing
```bash
#!/bin/bash
# scripts/memory-optimized.sh

ROOT_DIR=${1:-"./src"}
BATCH_SIZE=${2:-50}

echo "💾 Memory-optimized analysis (batch size: $BATCH_SIZE)"

# Process files in batches
find $ROOT_DIR -name "*.ts" -o -name "*.tsx" | \
split -l $BATCH_SIZE - batch-

for batch_file in batch-*; do
    echo "Processing batch: $batch_file"
    
    # Create temporary include file
    while read file; do
        echo "\"$file\""
    done < $batch_file > include-patterns.json
    
    # Process batch with memory limit
    NODE_OPTIONS="--max-old-space-size=2048" \
    fx --root $ROOT_DIR \
       --include-file include-patterns.json \
       --output "batch-$(basename $batch_file).jsonl"
    
    rm include-patterns.json
done

# Merge batch results
cat batch-*.jsonl > optimized-functions.jsonl
rm batch-* include-patterns.json

echo "✅ Memory-optimized analysis completed: optimized-functions.jsonl"
```

### Distributed Analysis

#### Multi-server Processing
```bash
#!/bin/bash
# scripts/distributed-analysis.sh

SERVERS=("server1" "server2" "server3")
PROJECT_PATH="/path/to/project"

echo "🌐 Distributed analysis across ${#SERVERS[@]} servers"

# Distribute work across servers
for i in "${!SERVERS[@]}"; do
    server=${SERVERS[$i]}
    partition=$((i + 1))
    
    echo "Starting analysis on: $server (partition $partition)"
    
    ssh $server "
        cd $PROJECT_PATH
        fx --root ./src \
           --partition $partition/${#SERVERS[@]} \
           --output functions-part-$partition.jsonl
    " &
done

# Wait for all servers to complete
wait

# Collect results from all servers
for i in "${!SERVERS[@]}"; do
    server=${SERVERS[$i]}
    partition=$((i + 1))
    
    scp $server:$PROJECT_PATH/functions-part-$partition.jsonl ./
done

# Merge distributed results
cat functions-part-*.jsonl > distributed-functions.jsonl
rm functions-part-*.jsonl

echo "✅ Distributed analysis completed: distributed-functions.jsonl"
```

---

## 🔧 Custom Integrations

### Database Integration

#### Store Results in Database
```bash
#!/bin/bash
# scripts/database-integration.sh

DATABASE_URL=${DATABASE_URL:-"postgresql://user:pass@localhost/codebase"}

echo "💾 Storing analysis results in database"

# Generate analysis
fx --root ./src --output functions.jsonl

# Convert JSONL to SQL
python3 << 'EOF'
import json
import psycopg2
import sys

# Connect to database
conn = psycopg2.connect(sys.argv[1])
cur = conn.cursor()

# Create table if not exists
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

# Insert data
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
print("✅ Data stored in database")
EOF

echo "✅ Database integration completed"
```

### API Integration

#### REST API for Function Analysis
```javascript
// server/function-analysis-api.js
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Analyze endpoint
app.post('/api/analyze', async (req, res) => {
    const { rootPath, domain, options = {} } = req.body;
    
    try {
        const outputFile = `analysis-${Date.now()}.jsonl`;
        const command = `fx --root "${rootPath}" --output "${outputFile}" ${domain ? `--domain "${domain}"` : ''}`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            
            // Read and return results
            const results = [];
            const content = fs.readFileSync(outputFile, 'utf8');
            content.split('\n').filter(line => line.trim()).forEach(line => {
                results.push(JSON.parse(line));
            });
            
            // Cleanup
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

// Search endpoint
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

// Metrics endpoint
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
    console.log(`Function Analysis API running on port ${PORT}`);
});
```

---

## 📈 Monitoring & Alerting

### Quality Degradation Alerts

#### Slack Integration
```bash
#!/bin/bash
# scripts/quality-alerts.sh

SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
QUALITY_THRESHOLD=${QUALITY_THRESHOLD:-10}

# Collect current metrics
fx metrics collect --root ./src

# Check for violations
VIOLATIONS=$(fx metrics trends --violations-only --count)

if [ "$VIOLATIONS" -gt "$QUALITY_THRESHOLD" ]; then
    MESSAGE="🚨 *Quality Alert*: $VIOLATIONS code quality violations detected in $(basename $(pwd))"
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$MESSAGE\"}" \
        $SLACK_WEBHOOK_URL
    
    echo "🚨 Quality alert sent to Slack"
    exit 1
fi

echo "✅ Quality within acceptable limits"
```

#### Email Reports
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
    """Generate comprehensive quality report"""
    result = subprocess.run(['fx', 'metrics', 'trends', '--format', 'json'], 
                          capture_output=True, text=True)
    return json.loads(result.stdout) if result.stdout else {}

def send_email_report(report_data, recipients):
    """Send email with quality report"""
    msg = MIMEMultipart()
    msg['From'] = 'quality-bot@company.com'
    msg['To'] = ', '.join(recipients)
    msg['Subject'] = f'Weekly Code Quality Report - {datetime.now().strftime("%Y-%m-%d")}'
    
    # Create HTML report
    html_body = f"""
    <html>
    <body>
        <h2>📊 Weekly Code Quality Report</h2>
        <p><strong>Report Date:</strong> {datetime.now().strftime("%Y-%m-%d %H:%M")}</p>
        
        <h3>🎯 Summary</h3>
        <ul>
            <li>Total Functions: {report_data.get('totalFunctions', 0)}</li>
            <li>Quality Violations: {len(report_data.get('violations', []))}</li>
            <li>Average Complexity: {report_data.get('averageComplexity', 0):.2f}</li>
        </ul>
        
        <h3>⚠️ Top Violations</h3>
        <ul>
    """
    
    for violation in report_data.get('violations', [])[:10]:
        html_body += f"<li>{violation['function']}: {violation['issue']}</li>"
    
    html_body += """
        </ul>
        
        <p><em>Generated automatically by Function Indexer</em></p>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(html_body, 'html'))
    
    # Send email
    server = smtplib.SMTP('smtp.company.com', 587)
    server.starttls()
    server.login('quality-bot@company.com', 'password')
    server.send_message(msg)
    server.quit()

if __name__ == '__main__':
    report = generate_quality_report()
    recipients = ['team-lead@company.com', 'architect@company.com']
    send_email_report(report, recipients)
    print("✅ Weekly quality report sent")
```

---

## 🎯 Summary

Advanced usage of Function Indexer enables:

### Enterprise Benefits
- **Automated Quality Gates**: Prevent quality degradation through CI/CD integration
- **Team Collaboration**: Standardized workflows across development teams
- **Historical Tracking**: Long-term quality trend analysis
- **Custom Workflows**: Specialized analysis for security, performance, and architecture

### Scalability Features
- **Large Codebase Support**: Parallel and distributed processing
- **Memory Optimization**: Batch processing for resource-constrained environments
- **API Integration**: Custom integrations with existing tools
- **Monitoring & Alerting**: Proactive quality management

### Best Practices
1. **Start Simple**: Begin with basic CI/CD integration
2. **Customize Gradually**: Add enterprise features as needed
3. **Monitor Continuously**: Set up automated quality tracking
4. **Collaborate Effectively**: Use team-focused workflows

For more advanced patterns and custom integrations, consider exploring the [AI Integration Guide](AI-INTEGRATION.md) and [Command Reference](COMMAND-REFERENCE.md).

---

**Enterprise-ready code quality management** 🏢✨