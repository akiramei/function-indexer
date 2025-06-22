# 🤖 Function Indexer - AI Assistant Guide

## Quick Overview
Function Indexer is a TypeScript CLI tool that scans codebases to extract all functions, methods, and arrow functions into structured JSONL format with code quality metrics.

### For AI Assistants
When asked to "manage code quality using Function Indexer", follow these steps:
1. Install Function Indexer globally
2. Run initial scan to establish baseline
3. Set up metrics collection for tracking
4. Configure CI/CD integration for automated checks
5. Create regular reports for code review

## Core Capabilities
- **Function Discovery**: Finds all functions in TypeScript/TSX files
- **Metrics Analysis**: Calculates complexity, lines of code, nesting depth
- **Search**: Natural language and pattern-based function search
- **Change Tracking**: Detects modifications via content hashing
- **Quality Monitoring**: Tracks code quality trends over time

## Installation & Basic Usage

```bash
# Prerequisites (Linux/WSL users only)
sudo apt update && sudo apt install build-essential python3

# Run directly with npx (recommended)
npx github:akiramei/function-indexer

# Scan specific directory with output file
npx github:akiramei/function-indexer --root ./src --output functions.jsonl

# Collect metrics for PR
npx github:akiramei/function-indexer collect-metrics --root ./src --pr 123

# Or install locally to project
npm install --save-dev github:akiramei/function-indexer
npx function-indexer
```

## Command Reference

### 1. Main Command - Generate Function Index
```bash
npx github:akiramei/function-indexer --root <path> --output <file> [options]
```
**Purpose**: Scans codebase and generates JSONL file with all functions
**Options**:
- `--root, -r`: Directory to scan (default: auto-detected)
- `--output, -o`: Output file (default: auto-generated in .function-indexer/)
- `--verbose, -v`: Show detailed progress

**Note**: Function Indexer now works with zero configuration - just run `npx github:akiramei/function-indexer` to get started!

**Output Format** (JSONL, one object per line):
```json
{
  "file": "src/services/auth.ts",
  "identifier": "validateToken",
  "signature": "async function validateToken(token: string): Promise<boolean>",
  "startLine": 15,
  "endLine": 28,
  "hash_function": "a3f5c912",
  "hash_file": "b8d4e7f1",
  "exported": true,
  "async": true,
  "metrics": {
    "linesOfCode": 12,
    "cyclomaticComplexity": 4,
    "cognitiveComplexity": 6,
    "nestingDepth": 2,
    "parameterCount": 1,
    "hasReturnType": true
  },
  "domain": "backend"
}
```

### 2. `search` - Find Functions
```bash
npx github:akiramei/function-indexer search <query> [options]
```
**Purpose**: Search functions by name, content, or natural language
**Options**:
- `--context, -c`: Provide context for the search
- `--limit, -l`: Max results (default: 10)
- `--no-save-history`: Don't save search to history

**Examples**:
```bash
# Find by name
npx github:akiramei/function-indexer search "validate"

# Natural language search with context
npx github:akiramei/function-indexer search "authentication" --context "login and security"

# Limit results
npx github:akiramei/function-indexer search "component" --limit 5
```

### 3. `metrics` - Analyze Code Quality
```bash
npx github:akiramei/function-indexer metrics [options]
```
**Purpose**: Display code quality metrics and violations
**Options**:
- `--details, -d`: Show detailed function-level metrics

**Output Example**:
```
📊 Code Quality Report
━━━━━━━━━━━━━━━━━━━
Total Functions: 142
Average Complexity: 4.3
Functions Above Threshold: 8

⚠️  High Complexity Functions:
1. processOrder (src/orders.ts:45) - Complexity: 18
2. calculateShipping (src/shipping.ts:122) - Complexity: 15
```

### 4. `collect-metrics` - Track Quality Over Time
```bash
npx github:akiramei/function-indexer collect-metrics --root <path> [options]
```
**Purpose**: Store metrics in SQLite database for trend analysis
**Options**:
- `--pr`: Associate with PR number
- `--branch`: Git branch name
- `--commit`: Specific commit hash

### 5. `show-metrics` - View Function History
```bash
npx github:akiramei/function-indexer show-metrics <function-path>
```
**Purpose**: Display metric history for specific function
**Format**: "file:functionName" or "file:className.methodName"
**Options**:
- `--limit, -l`: Limit number of history entries (default: 10)

**Example**:
```bash
npx github:akiramei/function-indexer show-metrics "src/auth.ts:validateToken"
```

### 6. `diff` - Compare Functions Between Branches
```bash
npx github:akiramei/function-indexer diff [base] [target]
```
**Purpose**: Compare functions between Git branches or commits
**Arguments**:
- `base`: Base branch or commit (default: main)
- `target`: Target branch or commit (default: HEAD)
**Options**:
- `--root, -r`: Project root directory
- `--output, -o`: Output file path
- `--format, -f`: Output format (terminal, markdown, json)
- `--thresholds`: Custom complexity thresholds as JSON

### 7. `report` - Generate Comprehensive Reports
```bash
npx github:akiramei/function-indexer report [options]
```
**Purpose**: Generate detailed code quality reports
**Options**:
- Various formatting and output options

### 8. `ci` - CI/CD Pipeline Integration
```bash
npx github:akiramei/function-indexer ci [options]
```
**Purpose**: Run analysis optimized for CI/CD pipelines
**Options**:
- `--format`: Output format (github, json, etc.)

### 9. Additional Commands
- `npx github:akiramei/function-indexer analyze-trends`: Analyze metrics trends and violations
- `npx github:akiramei/function-indexer pr-metrics <prNumber>`: Show metrics for a specific PR
- `npx github:akiramei/function-indexer update <index>`: Update an existing function index
- `npx github:akiramei/function-indexer validate <index>`: Validate index integrity
- `npx github:akiramei/function-indexer backup <index>`: Create backup of index
- `npx github:akiramei/function-indexer restore <backupId>`: Restore from backup

## AI Task Templates

### Task 1: Find Complex Functions for Refactoring
```
Using function-indexer, find all functions with cyclomatic complexity > 10 in the src/ directory and suggest refactoring priorities.

Commands to run:
1. npx github:akiramei/function-indexer --root ./src
2. npx github:akiramei/function-indexer metrics --details
```

### Task 2: Analyze Code Quality Before PR
```
Before merging PR #123, analyze the code quality impact:

Commands to run:
1. npx github:akiramei/function-indexer collect-metrics --root ./src --pr 123
2. npx github:akiramei/function-indexer pr-metrics 123
3. npx github:akiramei/function-indexer analyze-trends
```

### Task 3: Find Similar Functions
```
Find all functions that handle database operations:

Commands to run:
1. npx github:akiramei/function-indexer --root ./src
2. npx github:akiramei/function-indexer search "database" --context "async operations"
```

### Task 4: Monitor Function Growth
```
Track how a specific function has grown over time:

Commands to run:
1. npx github:akiramei/function-indexer show-metrics "src/core/processor.ts:processData" --limit 10
```

## Integration Patterns

### CI/CD Pipeline Integration
```yaml
# GitHub Actions Example
- name: Analyze Code Quality
  run: |
    # Install prerequisites for Linux/Ubuntu runners
    sudo apt update && sudo apt install build-essential python3
    npx github:akiramei/function-indexer collect-metrics --root ./src --pr ${{ github.event.number }}
    npx github:akiramei/function-indexer ci --format github
```

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
npx github:akiramei/function-indexer metrics --details
if [ $? -ne 0 ]; then
  echo "❌ Code quality check failed. Fix high complexity functions."
  exit 1
fi
```

### VS Code Task
```json
{
  "label": "Find Complex Functions",
  "type": "shell",
  "command": "npx github:akiramei/function-indexer metrics --details",
  "problemMatcher": []
}
```

## Metric Thresholds

| Metric | Good | Warning | Bad |
|--------|------|---------|-----|
| Cyclomatic Complexity | < 5 | 5-10 | > 10 |
| Cognitive Complexity | < 8 | 8-15 | > 15 |
| Lines of Code | < 20 | 20-40 | > 40 |
| Nesting Depth | ≤ 2 | 3 | > 3 |
| Parameter Count | ≤ 3 | 4 | > 4 |

## Common AI Workflows

### 1. Codebase Understanding
```bash
# Get overview
npx github:akiramei/function-indexer metrics

# Find entry points
npx github:akiramei/function-indexer search "main" --context "entry point"

# Find complex areas
npx github:akiramei/function-indexer metrics --details
```

### 2. Code Review Assistance
```bash
# Index changed files
npx github:akiramei/function-indexer --root ./src

# Check quality
npx github:akiramei/function-indexer metrics --details

# Compare branches
npx github:akiramei/function-indexer diff main HEAD
```

### 3. Refactoring Planning
```bash
# Find complex candidates
npx github:akiramei/function-indexer metrics --details

# Find duplicates
npx github:akiramei/function-indexer search "similar function names or patterns"
```

## Output Processing Tips

1. **Parse JSONL**: Each line is a complete JSON object
2. **Filter by metrics**: Use jq or similar tools
3. **Track changes**: Compare hash_function values
4. **Group by file**: Aggregate metrics per module

## Quick Decision Guide

- **Need to find a function?** → Use `search` command
- **Want quality overview?** → Use `metrics` command
- **Building automation?** → Use main command + parse JSONL
- **Tracking trends?** → Use `collect-metrics` + `analyze-trends`
- **Reviewing code?** → Use `metrics --details` or `diff` command
- **CI/CD integration?** → Use `ci` command

## Error Handling

- **No functions found**: Check --include patterns
- **Parse errors**: File might have syntax errors
- **Large codebases**: Use --exclude to skip unnecessary files
- **Memory issues**: Process directories separately

## Best Practices for AI Usage

1. Always run main command first to create fresh data
2. Use specific `--root` paths to limit scope
3. Combine multiple metrics for better insights
4. Store JSONL output for advanced processing
5. Use `--verbose` when debugging issues

## Quick Setup for New Projects

When setting up code quality management for a new project:

```bash
# 1. Install prerequisites (Linux/WSL only)
sudo apt update && sudo apt install build-essential python3

# 2. Check current quality status
cd your-project
npx github:akiramei/function-indexer metrics --details

# 3. Set up continuous monitoring
npx github:akiramei/function-indexer collect-metrics --pr $PR_NUMBER

# 4. Add to package.json scripts (optional)
npm pkg set scripts.quality="npx github:akiramei/function-indexer metrics"
npm pkg set scripts.quality:detailed="npx github:akiramei/function-indexer metrics --details"

# 5. Create GitHub Action (save as .github/workflows/code-quality.yml)
echo 'name: Code Quality Check
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: |
          sudo apt update && sudo apt install build-essential python3
          npx github:akiramei/function-indexer ci --format github' > .github/workflows/code-quality.yml
```