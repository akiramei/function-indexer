# 🤖 Function Indexer - AI Assistant Guide

## Quick Overview
Function Indexer is a TypeScript CLI tool that scans codebases to extract all functions, methods, and arrow functions into structured JSONL format with code quality metrics.

## Core Capabilities
- **Function Discovery**: Finds all functions in TypeScript/TSX files
- **Metrics Analysis**: Calculates complexity, lines of code, nesting depth
- **Search**: Natural language and pattern-based function search
- **Change Tracking**: Detects modifications via content hashing
- **Quality Monitoring**: Tracks code quality trends over time

## Installation & Basic Usage

```bash
# Install globally
npm install -g function-indexer

# Scan current directory
function-indexer

# Scan specific directory with output file
function-indexer index --root ./src --output functions.jsonl

# Collect metrics for PR
function-indexer collect-metrics --root ./src --pr 123
```

## Command Reference

### 1. `index` - Generate Function Index
```bash
function-indexer index --root <path> --output <file> [options]
```
**Purpose**: Scans codebase and generates JSONL file with all functions
**Options**:
- `--root`: Directory to scan (default: current)
- `--output`: Output file (default: function-index.jsonl)
- `--include`: File patterns to include (default: **/*.ts,**/*.tsx)
- `--exclude`: Patterns to exclude (default: node_modules,test files)
- `--domain`: Custom domain tag for categorization
- `--verbose`: Show detailed progress

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
- `--root`: Search directory
- `--limit`: Max results (default: 10)
- `--metrics`: Filter by metrics (e.g., --metrics.complexity ">10")

**Examples**:
```bash
# Find by name
function-indexer search "validate"

# Find complex functions
function-indexer search "*" --metrics.complexity ">15"

# Natural language search
function-indexer search "functions that handle authentication"
```

### 3. `metrics` - Analyze Code Quality
```bash
function-indexer metrics [options]
```
**Purpose**: Display code quality metrics and violations
**Options**:
- `--root`: Analysis directory
- `--threshold`: Show only violations
- `--sort`: Sort by metric (complexity, loc, nesting)

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

**Example**:
```bash
function-indexer show-metrics "src/auth.ts:validateToken"
```

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
3. function-indexer analyze-trends --days 30
```

### Task 3: Find Similar Functions
```
Find all async functions that handle database operations:

Commands to run:
1. function-indexer index --root ./src
2. function-indexer search "database" --metrics.async "true"
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
    npm install -g function-indexer
    function-indexer collect-metrics --root ./src --pr ${{ github.event.number }}
    function-indexer metrics --threshold --format markdown >> $GITHUB_STEP_SUMMARY
```

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
function-indexer metrics --threshold --root ./src
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
  "command": "function-indexer search '*' --metrics.complexity '>10'",
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
function-indexer metrics --root ./src

# Find entry points
function-indexer search "main" --exported true

# Find complex areas
function-indexer search "*" --metrics.complexity ">10"
```

### 2. Code Review Assistance
```bash
# Index changed files
function-indexer index --root ./src --include "**/changed/*.ts"

# Check quality
function-indexer metrics --threshold
```

### 3. Refactoring Planning
```bash
# Find candidates
function-indexer search "*" --metrics.loc ">50"

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
- **Building automation?** → Use `index` command + parse JSONL
- **Tracking trends?** → Use `collect-metrics` + `analyze-trends`
- **Reviewing code?** → Use `metrics --threshold`

## Error Handling

- **No functions found**: Check --include patterns
- **Parse errors**: File might have syntax errors
- **Large codebases**: Use --exclude to skip unnecessary files
- **Memory issues**: Process directories separately

## Best Practices for AI Usage

1. Always run `index` first to create fresh data
2. Use specific `--root` paths to limit scope
3. Combine multiple metrics for better insights
4. Store JSONL output for advanced processing
5. Use `--verbose` when debugging issues