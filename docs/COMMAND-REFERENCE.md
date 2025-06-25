# 📚 Function Indexer - Command Reference

**Quick Access Command Guide** | Version 1.1.0

## 🚀 Quick Command Lookup

| Task | Command | Example |
|------|---------|---------|
| **First-time setup** | `npx @akiramei/function-indexer` | `npx @akiramei/function-indexer` |
| **Index specific directory** | `function-indexer -r <path>` | `function-indexer -r ./src` |
| **Search functions** | `function-indexer search <query>` | `function-indexer search "auth"` |
| **View quality metrics** | `function-indexer metrics` | `function-indexer metrics --details` |
| **Compare branches** | `function-indexer diff <base> <target>` | `function-indexer diff main HEAD` |
| **Generate report** | `function-indexer report` | `function-indexer report --format html` |
| **CI/CD check** | `function-indexer ci` | `function-indexer ci --format github` |
| **Collect metrics** | `function-indexer collect-metrics` | `function-indexer collect-metrics --pr 123` |

## 📋 Complete Command Reference

### Core Commands

#### `function-indexer` - Main Indexing Command
Generate or update the function index for your codebase.

```bash
function-indexer [options]
```

**Options:**
- `-r, --root <path>` - Root directory to scan (auto-detected if omitted)
- `-o, --output <file>` - Output file path (auto-generated if omitted)
- `-v, --verbose` - Show detailed progress

**Examples:**
```bash
# First-time setup (zero config)
npx @akiramei/function-indexer

# Index specific directory
function-indexer --root ./src --output functions.jsonl

# Verbose output
function-indexer --verbose
```

---

### Search & Analysis Commands

#### `search` - Natural Language Function Search
Find functions using natural language or patterns.

```bash
function-indexer search <query> [options]
```

**Options:**
- `-c, --context <context>` - Additional context for search
- `-l, --limit <number>` - Maximum results (default: 10)
- `--no-save-history` - Don't save to search history

**Examples:**
```bash
# Simple search
function-indexer search "authentication"

# Search with context
function-indexer search "validate" --context "user input"

# Limit results
function-indexer search "handler" --limit 20
```

---

#### `metrics` - Code Quality Overview
Display code quality metrics and violations.

```bash
function-indexer metrics [options]
```

**Options:**
- `-d, --details` - Show all functions exceeding thresholds

**Examples:**
```bash
# Quick overview
function-indexer metrics

# Detailed violations
function-indexer metrics --details
```

---

### Comparison & Reporting Commands

#### `diff` - Compare Functions Between Branches
Compare function changes between Git branches or commits.

```bash
function-indexer diff [base] [target] [options]
```

**Arguments:**
- `base` - Base branch/commit (default: main)
- `target` - Target branch/commit (default: HEAD)

**Options:**
- `-r, --root <path>` - Project root directory
- `-o, --output <file>` - Save output to file
- `-f, --format <format>` - Output format: terminal, markdown, json
- `--thresholds <json>` - Custom complexity thresholds

**Examples:**
```bash
# Compare current branch with main
function-indexer diff

# Compare specific branches
function-indexer diff develop feature/new-auth

# Save as markdown
function-indexer diff main HEAD --format markdown --output changes.md

# Custom thresholds
function-indexer diff --thresholds '{"cyclomaticComplexity":8}'
```

---

#### `report` - Generate Quality Reports
Create comprehensive code quality reports.

```bash
function-indexer report [options]
```

**Options:**
- `-o, --output <file>` - Output file (default: stdout)
- `-f, --format <format>` - Format: markdown, html, json
- `-t, --template <path>` - Custom Handlebars template
- `--thresholds <json>` - Custom thresholds

**Examples:**
```bash
# Terminal output
function-indexer report

# HTML dashboard
function-indexer report --format html --output dashboard.html

# JSON for processing
function-indexer report --format json --output metrics.json
```

---

### CI/CD Integration Commands

#### `ci` - Continuous Integration Analysis
Run quality checks for CI/CD pipelines.

```bash
function-indexer ci [options]
```

**Options:**
- `-r, --root <path>` - Project root
- `-b, --base <branch>` - Base branch for comparison
- `-o, --output <file>` - Results output file
- `-f, --format <format>` - Format: terminal, github, gitlab, json
- `--thresholds <json>` - Custom thresholds
- `--fail-on-violation` - Exit with error on violations
- `--comment` - Generate PR/MR comment
- `-v, --verbose` - Verbose output

**Examples:**
```bash
# GitHub Actions
function-indexer ci --format github --fail-on-violation

# GitLab CI with comments
function-indexer ci --format gitlab --comment

# Custom thresholds
function-indexer ci --thresholds '{"cyclomaticComplexity":10}'
```

---

### Metrics Tracking Commands

#### `collect-metrics` - Collect Historical Metrics
Store function metrics for trend analysis.

```bash
function-indexer collect-metrics [options]
```

**Options:**
- `-r, --root <path>` - Root directory (default: ./src)
- `--metrics-output <file>` - Export to JSONL file
- `--pr <number>` - Associate with PR number
- `--commit <hash>` - Specific commit (default: HEAD)
- `--branch <name>` - Branch name (default: current)
- `--verbose-metrics` - Detailed output

**Examples:**
```bash
# Basic collection
function-indexer collect-metrics

# PR tracking
function-indexer collect-metrics --pr 123

# Export to file
function-indexer collect-metrics --metrics-output metrics.jsonl
```

---

#### `show-metrics` - View Function History
Display metrics history for specific functions.

```bash
function-indexer show-metrics [functionId] [options]
```

**Arguments:**
- `functionId` - Function path (format: "file:functionName")

**Options:**
- `-l, --limit <number>` - History entries limit (default: 10)
- `--list` - List all functions with metrics

**Examples:**
```bash
# List available functions
function-indexer show-metrics --list

# View specific function
function-indexer show-metrics "src/auth.ts:validateUser"

# Limit history
function-indexer show-metrics "src/api.ts:handleRequest" --limit 5
```

---

#### `analyze-trends` - Analyze Quality Trends
Analyze metrics trends and identify risk areas.

```bash
function-indexer analyze-trends
```

**Example:**
```bash
function-indexer analyze-trends
```

---

#### `pr-metrics` - PR-Specific Metrics
Show all metrics for a specific pull request.

```bash
function-indexer pr-metrics <prNumber>
```

**Example:**
```bash
function-indexer pr-metrics 123
```

---

### Maintenance Commands

#### `update` - Update Existing Index
Update a function index with latest changes.

```bash
function-indexer update <index> [options]
```

**Options:**
- `--auto-backup` - Create backup before update (default: true)
- `--no-backup` - Skip backup
- `-v, --verbose` - Verbose output

**Examples:**
```bash
# Update with backup
function-indexer update function-index.jsonl

# Skip backup
function-indexer update function-index.jsonl --no-backup
```

---

#### `validate` - Validate Index Integrity
Check if a function index is valid and uncorrupted.

```bash
function-indexer validate <index>
```

**Example:**
```bash
function-indexer validate function-index.jsonl
```

---

#### `backup` - Create Index Backup
Create a backup of function indexes.

```bash
function-indexer backup <index>
```

**Example:**
```bash
function-indexer backup function-index.jsonl
```

---

#### `restore` - Restore from Backup
Restore function indexes from a backup.

```bash
function-indexer restore <backupId>
```

**Example:**
```bash
function-indexer restore backup-20240115-123456
```

---

### Utility Commands

#### `show-history` - View Search History
Display previous search queries and results.

```bash
function-indexer show-history [options]
```

**Options:**
- `-q, --query <query>` - Filter by query

**Examples:**
```bash
# All history
function-indexer show-history

# Filter by query
function-indexer show-history --query "auth"
```

---

#### `generate-descriptions` - AI Descriptions
Generate AI-powered descriptions for functions (requires OpenAI API key).

```bash
function-indexer generate-descriptions [options]
```

**Options:**
- `-i, --index <file>` - Input index file
- `-o, --output <file>` - Output file
- `-b, --batch-size <number>` - Batch size for processing

**Example:**
```bash
# Requires OPENAI_API_KEY in environment
function-indexer generate-descriptions -i functions.jsonl -o enhanced.jsonl
```

---

## 💡 Common Usage Patterns

### Initial Project Setup
```bash
# 1. Initialize and scan
npx @akiramei/function-indexer

# 2. View quality overview
function-indexer metrics

# 3. Search for specific functions
function-indexer search "main entry point"
```

### Daily Development Workflow
```bash
# Update index with latest changes
function-indexer

# Check quality before commit
function-indexer metrics --details

# Compare with main branch
function-indexer diff
```

### Code Review Process
```bash
# Compare PR changes
function-indexer diff main feature-branch

# Generate detailed report
function-indexer report --format markdown --output pr-analysis.md

# Check specific functions
function-indexer search "modified functions" --context "authentication"
```

### CI/CD Pipeline
```bash
# In GitHub Actions
- run: |
    npx @akiramei/function-indexer collect-metrics --pr ${{ github.event.number }}
    npx @akiramei/function-indexer ci --format github --fail-on-violation

# In GitLab CI
- script: |
    npx @akiramei/function-indexer ci --format gitlab --comment
```

### Quality Tracking
```bash
# Collect metrics for current state
function-indexer collect-metrics

# View trends
function-indexer analyze-trends

# Track specific function
function-indexer show-metrics "src/core.ts:processData"
```

## 🔧 Configuration

Function Indexer uses configuration files in `.function-indexer/` directory:

### Core Configuration (config.json)
```json
{
  "version": "1.1.0",
  "root": "./src",
  "output": "function-index.jsonl",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

### Metrics Configuration (metrics-config.json)
```json
{
  "thresholds": {
    "cyclomaticComplexity": 10,
    "cognitiveComplexity": 15,
    "linesOfCode": 50,
    "nestingDepth": 4,
    "parameterCount": 4
  }
}
```

## 📝 Notes

- Most commands require initialization first (`function-indexer` with no args)
- Use `--verbose` flag for debugging issues
- Function IDs format: `"path/to/file.ts:functionName"` or `"path/to/file.ts:ClassName.methodName"`
- All paths are relative to the project root
- JSONL format: one JSON object per line

---

*For AI integration patterns and advanced usage, see the [AI Master Guide](./AI-MASTER-GUIDE.md)*