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
npx @akiramei/function-indexer

# Scan specific directory with output file  
npx @akiramei/function-indexer --root ./src --output functions.jsonl

# Collect metrics for PR
npx @akiramei/function-indexer collect-metrics --root ./src --pr 123

# Or install locally to project
npm install --save-dev @akiramei/function-indexer
npx function-indexer

# Alternative: GitHub direct install (development version)
npx github:akiramei/function-indexer
```

## Command Reference

### 1. Main Command - Generate Function Index
```bash
npx @akiramei/function-indexer --root <path> --output <file> [options]
```
**Purpose**: Scans codebase and generates JSONL file with all functions
**Options**:
- `--root, -r`: Directory to scan (default: auto-detected)
- `--output, -o`: Output file (default: auto-generated in .function-indexer/)
- `--verbose, -v`: Show detailed progress

**Note**: Function Indexer now works with zero configuration - just run `npx @akiramei/function-indexer` to get started!

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

### 2. `search` - Find Functions (IMPROVED!)
```bash
npx @akiramei/function-indexer search <query> [options]
```
**Purpose**: Search functions by name, content, or natural language
**Options**:
- `--context, -c`: Provide context for the search
- `--limit, -l`: Max results (default: 100) - **INCREASED from 10!**
- `--all`: Show all results (no limit) - **NEW!**
- `--no-save-history`: Don't save search to history

**Examples**:
```bash
# Find by name (now shows up to 100 results by default)
npx @akiramei/function-indexer search "validate"

# Show ALL matching results (no limit)
npx @akiramei/function-indexer search "validate" --all

# Show all functions in project (empty query + --all)
npx @akiramei/function-indexer search "" --all

# Wildcard search for all functions
npx @akiramei/function-indexer search "*" --all

# Natural language search with context
npx @akiramei/function-indexer search "authentication" --context "login and security"

# Custom limit
npx @akiramei/function-indexer search "component" --limit 50
```

**Key Improvements**:
- **10x more results**: Default limit increased from 10 to 100
- **Unlimited search**: Use `--all` to see every matching function
- **Global search**: Empty query `""` with `--all` shows entire codebase
- **Smart truncation**: Clear indication when results are limited with usage hints

### 3. `metrics` - Analyze Code Quality
```bash
npx @akiramei/function-indexer metrics [options]
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
npx @akiramei/function-indexer collect-metrics --root <path> [options]
```
**Purpose**: Store metrics in SQLite database for trend analysis (optionally export to JSONL)
**Options**:
- `--metrics-output <file>`: Output JSONL file for metrics history (optional)
- `--verbose-metrics`: Verbose output for metrics collection
- `--pr`: Associate with PR number
- `--branch`: Git branch name
- `--commit`: Specific commit hash

**Examples**:
```bash
# Store in database only
npx @akiramei/function-indexer collect-metrics --root ./src --pr 123

# Store in database AND export to JSONL file
npx @akiramei/function-indexer collect-metrics --root ./src --metrics-output .quality/metrics-history.jsonl

# With verbose output
npx @akiramei/function-indexer collect-metrics --root ./src --metrics-output .quality/metrics-history.jsonl --verbose-metrics
```

### 5. `show-metrics` - View Function History
```bash
npx @akiramei/function-indexer show-metrics [function-path]
```
**Purpose**: Display metric history for specific function or list all available functions
**Format**: "file:functionName" or "file:className.methodName"
**Options**:
- `--limit, -l`: Limit number of history entries (default: 10)
- `--list`: List all functions with metrics data

**Examples**:
```bash
# List all functions with metrics data
npx @akiramei/function-indexer show-metrics
npx @akiramei/function-indexer show-metrics --list

# Show history for specific function
npx @akiramei/function-indexer show-metrics "src/auth.ts:validateToken"
```

### 6. `diff` - Compare Functions Between Branches/Commits
```bash
npx @akiramei/function-indexer diff [base] [target]
```
**Purpose**: Compare functions between Git branches or commits - **Perfect for Phase Management**
**Arguments**:
- `base`: Base branch or commit (default: main)
- `target`: Target branch or commit (default: HEAD)
**Options**:
- `--root, -r`: Project root directory
- `--output, -o`: Output file path
- `--format, -f`: Output format (terminal, markdown, json)
- `--thresholds <json>`: Custom complexity thresholds as JSON

**Examples**:
```bash
# Compare phase 1 vs phase 2 (using commit hashes)
npx @akiramei/function-indexer diff abc123f def456g --format markdown --output phase-comparison.md

# Compare current branch with main
npx @akiramei/function-indexer diff main HEAD --format json

# Compare with custom thresholds
npx @akiramei/function-indexer diff main HEAD --thresholds '{"cyclomaticComplexity":15,"linesOfCode":50}'
```

**Output includes**:
- Added, modified, removed functions
- Quality metric changes (complexity increases/decreases)  
- Functions exceeding thresholds
- Summary statistics

### 7. `report` - Generate Comprehensive Code Quality Reports
```bash
npx @akiramei/function-indexer report [options]
```
**Purpose**: Generate detailed, shareable code quality reports for stakeholders
**Options**:
- `--template, -t <path>`: Custom Handlebars template path
- `--output, -o <path>`: Output file path (default: stdout)
- `--format, -f <format>`: Output format (markdown, html, json) (default: markdown)
- `--thresholds <json>`: Custom complexity thresholds as JSON

**Examples**:
```bash
# Generate Markdown report for phase review
npx @akiramei/function-indexer report --format markdown --output phase2-quality-report.md

# Generate HTML report for management
npx @akiramei/function-indexer report --format html --output quality-dashboard.html

# Generate JSON data for further analysis
npx @akiramei/function-indexer report --format json --output metrics-data.json

# Custom thresholds for enterprise standards
npx @akiramei/function-indexer report --thresholds '{"cyclomaticComplexity":8,"cognitiveComplexity":12}'
```

**Report includes**:
- Overall quality metrics summary
- Functions exceeding complexity thresholds
- Quality distribution charts (in HTML format)
- Recommendations for improvement
- File-by-file breakdown

### 8. `ci` - CI/CD Pipeline Integration
```bash
npx @akiramei/function-indexer ci [options]
```
**Purpose**: Run automated quality analysis in CI/CD pipelines with PR integration
**Options**:
- `--root, -r <path>`: Project root directory
- `--base, -b <branch>`: Base branch for comparison
- `--output, -o <path>`: Output file for results
- `--format, -f <format>`: Output format (terminal, github, gitlab, json)
- `--thresholds <json>`: Custom complexity thresholds as JSON
- `--fail-on-violation`: Exit with error code if violations found
- `--no-fail-on-violation`: Do not exit with error code if violations found
- `--comment`: Generate PR comment (for GitHub/GitLab)
- `--verbose, -v`: Enable verbose output

**Examples**:
```bash
# GitHub Actions integration
npx @akiramei/function-indexer ci --format github --base main --fail-on-violation

# GitLab CI with PR comments
npx @akiramei/function-indexer ci --format gitlab --comment --base main

# Custom quality gates
npx @akiramei/function-indexer ci --thresholds '{"cyclomaticComplexity":10}' --fail-on-violation

# JSON output for custom processing
npx @akiramei/function-indexer ci --format json --output ci-results.json
```

**Features**:
- Automatic base branch detection
- Quality gate enforcement (fail builds on violations)
- PR comment generation with quality summary
- Multiple CI platform support (GitHub, GitLab)
- Integration with existing quality thresholds

### 9. Additional Commands
- `npx @akiramei/function-indexer analyze-trends`: Analyze metrics trends and violations
- `npx @akiramei/function-indexer pr-metrics <prNumber>`: Show metrics for a specific PR
- `npx @akiramei/function-indexer update <index>`: Update an existing function index
- `npx @akiramei/function-indexer validate <index>`: Validate index integrity
- `npx @akiramei/function-indexer backup <index>`: Create backup of index
- `npx @akiramei/function-indexer restore <backupId>`: Restore from backup

## Phase Management Workflow

Function Indexer is designed for **phase-based development quality management**. Here's how to track quality across development phases:

### Phase Setup and Baseline Collection
```bash
# Phase 1 completion - establish baseline
git tag phase-1-complete
npx @akiramei/function-indexer collect-metrics --root ./src --metrics-output .quality/phase1-metrics.jsonl
npx @akiramei/function-indexer report --format html --output .quality/phase1-quality-report.html
```

### Phase Transition and Comparison  
```bash
# Phase 2 completion - collect new metrics
git tag phase-2-complete
npx @akiramei/function-indexer collect-metrics --root ./src --metrics-output .quality/phase2-metrics.jsonl

# Compare phases directly using commits/tags
npx @akiramei/function-indexer diff phase-1-complete phase-2-complete --format markdown --output .quality/phase1-vs-phase2-comparison.md

# Generate comprehensive phase 2 report
npx @akiramei/function-indexer report --format html --output .quality/phase2-quality-report.html
```

### Identifying Quality Changes
```bash
# Find functions with significant changes
npx @akiramei/function-indexer diff phase-1-complete phase-2-complete --format json | jq '.modified[] | select(.metrics.cyclomaticComplexity.change > 5)'

# Current violations analysis
npx @akiramei/function-indexer analyze-trends

# Specific function history across phases
npx @akiramei/function-indexer show-metrics "src/core/processor.ts:processData" --limit 10
```

### Management Reporting
```bash
# Executive summary report (HTML with charts)
npx @akiramei/function-indexer report --format html --output executive-quality-summary.html

# Technical team report (detailed Markdown)
npx @akiramei/function-indexer report --format markdown --output technical-quality-details.md

# Data export for external tools
npx @akiramei/function-indexer report --format json --output quality-metrics.json
```

## AI Task Templates

### Task 1: Find Complex Functions for Refactoring
```
Using function-indexer, find all functions with cyclomatic complexity > 10 in the src/ directory and suggest refactoring priorities.

Commands to run:
1. npx @akiramei/function-indexer --root ./src
2. npx @akiramei/function-indexer metrics --details
```

### Task 2: Phase Quality Comparison Analysis
```
Compare quality changes between development phases to identify areas of concern:

Commands to run:
1. npx @akiramei/function-indexer diff phase-1-complete phase-2-complete --format markdown --output phase-comparison.md
2. npx @akiramei/function-indexer analyze-trends
3. npx @akiramei/function-indexer report --format html --output current-quality-dashboard.html

Expected outputs:
- Markdown comparison showing function-level changes
- List of functions exceeding quality thresholds  
- HTML dashboard for stakeholder presentation
```

### Task 3: PR Quality Gate Analysis
```
Before merging PR #123, analyze the code quality impact:

Commands to run:
1. npx @akiramei/function-indexer ci --base main --format github --fail-on-violation
2. npx @akiramei/function-indexer collect-metrics --root ./src --pr 123 --metrics-output .quality/pr-123-metrics.jsonl
3. npx @akiramei/function-indexer pr-metrics 123

Or using npm scripts (if configured):
1. npm run quality:collect
2. npm run quality:trends
```

### Task 4: Find Similar Functions
```
Find all functions that handle database operations:

Commands to run:
1. npx @akiramei/function-indexer --root ./src
2. npx @akiramei/function-indexer search "database" --context "async operations"
```

### Task 5: Monitor Function Growth
```
Track how a specific function has grown over time:

Commands to run:
1. npx @akiramei/function-indexer show-metrics "src/core/processor.ts:processData" --limit 10
```

## Integration Patterns

### CI/CD Pipeline Integration
```yaml
# GitHub Actions Example (using npm package)
- name: Analyze Code Quality
  run: |
    # Install prerequisites for Linux/Ubuntu runners
    sudo apt update && sudo apt install build-essential python3
    npx @akiramei/function-indexer collect-metrics --root ./src --pr ${{ github.event.number }}
    npx @akiramei/function-indexer ci --format github

# Alternative: GitHub Actions with local build
- name: Analyze Code Quality
  run: |
    sudo apt update && sudo apt install build-essential python3
    npm ci
    npm run build
    node dist/cli.js collect-metrics --root ./src --pr ${{ github.event.number }}
    node dist/cli.js ci --format github
```

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
npx @akiramei/function-indexer metrics --details
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
  "command": "npx @akiramei/function-indexer metrics --details",
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
npx @akiramei/function-indexer metrics

# Find entry points
npx @akiramei/function-indexer search "main" --context "entry point"

# Find complex areas
npx @akiramei/function-indexer metrics --details
```

### 2. Code Review Assistance
```bash
# Index changed files
npx @akiramei/function-indexer --root ./src

# Check quality
npx @akiramei/function-indexer metrics --details

# Compare branches
npx @akiramei/function-indexer diff main HEAD
```

### 3. Refactoring Planning
```bash
# Find complex candidates
npx @akiramei/function-indexer metrics --details

# Find duplicates
npx @akiramei/function-indexer search "similar function names or patterns"
```

## Output Processing Tips

1. **Parse JSONL**: Each line is a complete JSON object
2. **Filter by metrics**: Use jq or similar tools
3. **Track changes**: Compare hash_function values
4. **Group by file**: Aggregate metrics per module

## Quick Decision Guide

- **Need to find a function?** → Use `search` command
- **Want quality overview?** → Use `metrics` command  
- **Comparing phases/branches?** → Use `diff` command
- **Need comprehensive reports?** → Use `report` command
- **Building automation?** → Use main command + parse JSONL
- **Tracking trends over time?** → Use `collect-metrics` + `analyze-trends`
- **Reviewing code changes?** → Use `metrics --details` or `diff` command
- **CI/CD integration?** → Use `ci` command
- **Management reporting?** → Use `report --format html`
- **Phase management?** → Use `diff` + `collect-metrics` + `report`

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

## Zero-Shot AI Assistant Guide

When an AI assistant is asked to help with code quality management using Function Indexer, follow these patterns:

### For Phase-Based Quality Management:
1. **Establish Baseline**: `collect-metrics` + `report`
2. **Compare Phases**: `diff [phase1-commit] [phase2-commit]`
3. **Generate Reports**: `report --format html`
4. **Track Changes**: `show-metrics` for specific functions

### For PR/MR Quality Gates:
1. **Quality Check**: `ci --base main --fail-on-violation`
2. **Detailed Analysis**: `diff main HEAD --format markdown`
3. **Collect Data**: `collect-metrics --pr [number]`

### For General Quality Analysis:
1. **Overview**: `metrics` or `metrics --details`
2. **Find Issues**: `analyze-trends`
3. **Search Functions**: `search [query] --context [context]`
4. **Export Data**: `report --format json`

### Key Commands by Use Case:
- **Executive Reporting**: `report --format html`
- **Technical Analysis**: `diff` + `metrics --details`
- **CI/CD Integration**: `ci --format github`
- **Historical Tracking**: `collect-metrics` + `show-metrics`

## Configuration File Support

Function Indexer supports **project-specific configuration** through a JSON configuration file:

**File Location**: `.function-indexer/config.json` (automatically created on first run)

**Example Configuration**:
```json
{
  "version": "1.0.0",
  "root": "src",
  "output": ".function-indexer/index.jsonl",
  "domain": "main",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"],
  "metrics": {
    "thresholds": {
      "cyclomaticComplexity": 8,
      "cognitiveComplexity": 12,
      "linesOfCode": 30,
      "nestingDepth": 3,
      "parameterCount": 3
    }
  }
}
```

**Configuration Features**:
- **Custom Quality Thresholds**: Set project-specific complexity, lines of code, and other metric limits
- **Include/Exclude Patterns**: Define which files to scan or ignore using glob patterns
- **Root Directory**: Set the default scanning directory
- **Output Path**: Customize where function indexes are saved
- **Automatic Integration**: All commands respect the configuration file settings

**Default Thresholds**:
- Cyclomatic Complexity: 10
- Cognitive Complexity: 15
- Lines of Code: 50
- Nesting Depth: 4
- Parameter Count: 4

## Quick Setup for New Projects

When setting up code quality management for a new project:

```bash
# 1. Install prerequisites (Linux/WSL only)
sudo apt update && sudo apt install build-essential python3

# 2. Initialize project (creates .function-indexer/config.json automatically)
cd your-project
npx @akiramei/function-indexer

# 3. Customize configuration (optional)
# Edit .function-indexer/config.json with your preferred thresholds and patterns

# 4. Check current quality status
npx @akiramei/function-indexer metrics --details

# 5. Set up continuous monitoring
npx @akiramei/function-indexer collect-metrics --pr $PR_NUMBER

# 6. Add to package.json scripts (optional)
npm pkg set scripts.quality="npx @akiramei/function-indexer metrics"
npm pkg set scripts.quality:detailed="npx @akiramei/function-indexer metrics --details"
npm pkg set scripts.quality:collect="npx @akiramei/function-indexer collect-metrics --root ./src --metrics-output .quality/metrics-history.jsonl"
npm pkg set scripts.quality:show="npx @akiramei/function-indexer show-metrics --list"
npm pkg set scripts.quality:trends="npx @akiramei/function-indexer analyze-trends"

# 7. Use the quality scripts
npm run quality          # Show code quality overview
npm run quality:collect  # Collect metrics to .quality/metrics-history.jsonl
npm run quality:show     # List all functions with metrics data
npm run quality:trends   # Analyze trends and violations

# 8. Create GitHub Action (save as .github/workflows/code-quality.yml)
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
          npm ci && npm run build
          node dist/cli.js ci --format github' > .github/workflows/code-quality.yml
```