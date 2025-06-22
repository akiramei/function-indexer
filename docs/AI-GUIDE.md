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
# Install globally
npm install -g github:akiramei/function-indexer

# Scan current directory
function-indexer

# Scan specific directory with output file
function-indexer --root ./src --output functions.jsonl

# Collect metrics for PR
function-indexer collect-metrics --root ./src --pr 123
```

## Command Reference

### 1. Main Command - Generate Function Index
```bash
function-indexer --root <path> --output <file> [options]
```
**Purpose**: Scans codebase and generates JSONL file with all functions
**Options**:
- `--root, -r`: Directory to scan (default: auto-detected)
- `--output, -o`: Output file (default: auto-generated in .function-indexer/)
- `--verbose, -v`: Show detailed progress

**Note**: Function Indexer now works with zero configuration - just run `function-indexer` to get started!

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
function-indexer search <query> [options]
```
**Purpose**: Search functions by name, content, or natural language
**Options**:
- `--context, -c`: Provide context for the search
- `--limit, -l`: Max results (default: 10)
- `--no-save-history`: Don't save search to history

**Examples**:
```bash
# Find by name
function-indexer search "validate"

# Natural language search with context
function-indexer search "authentication" --context "login and security"

# Limit results
function-indexer search "component" --limit 5
```

### 3. `metrics` - Analyze Code Quality
```bash
function-indexer metrics [options]
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
function-indexer collect-metrics --root <path> [options]
```
**Purpose**: Store metrics in SQLite database for trend analysis
**Options**:
- `--pr`: Associate with PR number
- `--branch`: Git branch name
- `--commit`: Specific commit hash

### 5. `show-metrics` - View Function History
```bash
function-indexer show-metrics <function-path>
```
**Purpose**: Display metric history for specific function
**Format**: "file:functionName" or "file:className.methodName"
**Options**:
- `--limit, -l`: Limit number of history entries (default: 10)

**Example**:
```bash
function-indexer show-metrics "src/auth.ts:validateToken"
```

### 6. `diff` - Compare Functions Between Branches
```bash
function-indexer diff [base] [target]
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
function-indexer report [options]
```
**Purpose**: Generate detailed code quality reports
**Options**:
- Various formatting and output options

### 8. `ci` - CI/CD Pipeline Integration
```bash
function-indexer ci [options]
```
**Purpose**: Run analysis optimized for CI/CD pipelines
**Options**:
- `--format`: Output format (github, json, etc.)

### 9. Additional Commands
- `analyze-trends`: Analyze metrics trends and violations
- `pr-metrics <prNumber>`: Show metrics for a specific PR
- `update <index>`: Update an existing function index
- `validate <index>`: Validate index integrity
- `backup <index>`: Create backup of index
- `restore <backupId>`: Restore from backup

## AI Task Templates

### Task 1: Find Complex Functions for Refactoring
```
Using function-indexer, find all functions with cyclomatic complexity > 10 in the src/ directory and suggest refactoring priorities.

Commands to run:
1. function-indexer index --root ./src
2. function-indexer search "*" --metrics.complexity ">10" --limit 20
```

### Task 2: Analyze Code Quality Before PR
```
Before merging PR #123, analyze the code quality impact:

Commands to run:
1. function-indexer collect-metrics --root ./src --pr 123
2. function-indexer pr-metrics 123
3. function-indexer analyze-trends
```

### Task 3: Find Similar Functions
```
Find all functions that handle database operations:

Commands to run:
1. function-indexer --root ./src
2. function-indexer search "database" --context "async operations"
```

### Task 4: Monitor Function Growth
```
Track how a specific function has grown over time:

Commands to run:
1. function-indexer show-metrics "src/core/processor.ts:processData" --limit 10
```

## Integration Patterns

### CI/CD Pipeline Integration
```yaml
# GitHub Actions Example
- name: Analyze Code Quality
  run: |
    npm install -g github:akiramei/function-indexer
    function-indexer collect-metrics --root ./src --pr ${{ github.event.number }}
    function-indexer ci --format github
```

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
function-indexer metrics --details
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
  "command": "function-indexer metrics --details",
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
function-indexer metrics

# Find entry points
function-indexer search "main" --context "entry point"

# Find complex areas
function-indexer metrics --details
```

### 2. Code Review Assistance
```bash
# Index changed files
function-indexer --root ./src

# Check quality
function-indexer metrics --details

# Compare branches
function-indexer diff main HEAD
```

### 3. Refactoring Planning
```bash
# Find complex candidates
function-indexer metrics --details

# Find duplicates
function-indexer search "similar function names or patterns"
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
# 1. Install and initialize
npm install -g github:akiramei/function-indexer
cd your-project
function-indexer

# 2. Check current quality status
function-indexer metrics --details

# 3. Set up continuous monitoring
function-indexer collect-metrics --pr $PR_NUMBER

# 4. Add to package.json scripts
npm pkg set scripts.quality="function-indexer metrics"
npm pkg set scripts.quality:detailed="function-indexer metrics --details"

# 5. Create GitHub Action (save as .github/workflows/code-quality.yml)
echo 'name: Code Quality Check
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g github:akiramei/function-indexer
      - run: function-indexer ci --format github' > .github/workflows/code-quality.yml
```