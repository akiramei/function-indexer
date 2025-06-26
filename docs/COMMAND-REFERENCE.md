# 📚 Function Indexer - AI-Optimized Command Reference

**Comprehensive Command Guide for AI Assistants** | Version 1.1.0

## 🎯 Command Categories

### 🔍 Core Commands (High Priority - Daily Use)
Function discovery and indexing - **90% of AI usage**

### 📊 Metrics Commands (Medium Priority - Quality Focus)
Code quality analysis and tracking - **10% of AI usage**

### 🔧 Development Commands (Medium Priority - Workflow Integration)
CI/CD and development workflow support

### 🛠️ Management Commands (Low Priority - Maintenance)
Backup, repair, and maintenance operations

## 🚀 Quick Command Lookup

| Task | Command | Priority | Category |
|------|---------|----------|----------|
| **First-time setup** | `npx @akiramei/function-indexer` | High | Core |
| **Update index** | `function-indexer` | High | Core |
| **Search functions** | `function-indexer search <query>` | High | Core |
| **List functions** | `function-indexer list` | High | Core |
| **View quality metrics** | `function-indexer metrics` | Medium | Metrics |
| **Collect metrics** | `function-indexer collect-metrics` | Medium | Metrics |
| **Compare branches** | `function-indexer diff` | Medium | Development |
| **Generate report** | `function-indexer report` | Medium | Development |
| **CI/CD check** | `function-indexer ci` | Medium | Development |
| **Validate index** | `function-indexer validate` | Low | Management |

---

## 🔍 Core Commands (High Priority)

### `function-indexer` (default command)

**Purpose**: Generate or update function index for TypeScript/TSX codebases  
**Category**: Core  
**Priority**: High  
**AI Usage**: First command to run in any project, establishes baseline for all other operations

#### Syntax
```bash
function-indexer [options]
```

#### Options
- `--root, -r <path>` - Root directory to scan (string, default: auto-detected)
- `--output, -o <file>` - Output file path (string, default: .function-indexer/index.jsonl)
- `--verbose, -v` - Verbose output (boolean, default: false)
- `--domain <name>` - Domain identifier (string, default: "main")

#### Output Format
Creates JSONL file where each line contains:
```json
{
  "file": "src/utils/auth.ts",
  "identifier": "validateToken",
  "signature": "async function validateToken(token: string): Promise<boolean>",
  "startLine": 15,
  "endLine": 28,
  "hash_function": "a1b2c3d4",
  "hash_file": "e5f6g7h8",
  "exported": true,
  "async": true,
  "metrics": {
    "linesOfCode": 12,
    "cyclomaticComplexity": 3,
    "cognitiveComplexity": 4,
    "nestingDepth": 2,
    "parameterCount": 1,
    "hasReturnType": true
  },
  "domain": "main"
}
```

#### Examples
```bash
# First-time setup (zero config)
npx @akiramei/function-indexer

# Update existing index
function-indexer

# Index specific directory with custom output
function-indexer --root ./src --output functions.jsonl --verbose

# Index with domain identifier
function-indexer --domain "auth-module"
```

#### AI Integration Notes
- **Always run first**: Establishes the function index baseline
- **Check output existence**: Verify index file exists before other operations
- **Use verbose for debugging**: Add --verbose when troubleshooting
- **Performance**: Processes ~1000 files/second on average hardware
- **Memory usage**: ~100MB per 10,000 functions
- **Error handling**: Continues on parse errors, logs to stderr

---

### `search`

**Purpose**: Natural language search for functions by name, purpose, or context  
**Category**: Core  
**Priority**: High  
**AI Usage**: Primary discovery tool for finding relevant functions

#### Syntax
```bash
function-indexer search <query> [options]
```

#### Arguments
- `query` - Search query (required, supports natural language)

#### Options
- `--limit <number>` - Maximum results (number, default: 100)
- `--all` - Show all results without limit (boolean, default: false)
- `--context <string>` - Additional search context (string)
- `--min-score <number>` - Minimum relevance score 0-1 (number, default: 0.1)
- `--format <type>` - Output format: text|json|jsonl (string, default: text)

#### Output Format
Default text format:
```
🔍 Search results for "authentication":

1. src/auth/tokenValidator.ts:validateToken (score: 0.95)
   async function validateToken(token: string): Promise<boolean>
   Lines: 15-28 | Complexity: 3

2. src/auth/userAuth.ts:authenticateUser (score: 0.89)
   export async function authenticateUser(credentials: UserCredentials): Promise<User>
   Lines: 42-78 | Complexity: 5
```

JSON format (`--format json`):
```json
{
  "query": "authentication",
  "total": 2,
  "results": [
    {
      "file": "src/auth/tokenValidator.ts",
      "identifier": "validateToken",
      "signature": "async function validateToken(token: string): Promise<boolean>",
      "score": 0.95,
      "startLine": 15,
      "endLine": 28,
      "metrics": { "cyclomaticComplexity": 3 }
    }
  ]
}
```

#### Examples
```bash
# Basic search
function-indexer search "authentication"

# Search with context
function-indexer search "validate" --context "user input"

# Get all results in JSON
function-indexer search "async functions" --all --format json

# High-relevance search
function-indexer search "main entry point" --min-score 0.8
```

#### AI Integration Notes
- **Natural language queries**: Supports semantic search, not just keyword matching
- **Context improves accuracy**: Use --context for domain-specific searches
- **Score interpretation**: >0.8 = high relevance, 0.5-0.8 = moderate, <0.5 = low
- **Performance**: Searches 100k functions in <100ms
- **Best practices**: Start broad, then refine with context

---

### `list`

**Purpose**: List all indexed functions with filtering options  
**Category**: Core  
**Priority**: High  
**AI Usage**: Enumerate functions for analysis, generate inventories

#### Syntax
```bash
function-indexer list [options]
```

#### Options
- `--filter <pattern>` - Filter by file path pattern (string)
- `--exported` - Show only exported functions (boolean)
- `--async` - Show only async functions (boolean)
- `--sort <field>` - Sort by: name|file|complexity|lines (string, default: file)
- `--format <type>` - Output format: text|json|csv (string, default: text)
- `--output <file>` - Save to file instead of stdout (string)

#### Output Format
Text format (default):
```
📋 Function Inventory (216 total)

src/auth/tokenValidator.ts
  ├─ validateToken (async, exported) - Lines: 15-28
  └─ parseJWT (internal) - Lines: 30-45

src/core/processor.ts
  ├─ processData (exported) - Lines: 10-125
  ├─ validateInput (internal) - Lines: 130-145
  └─ formatOutput (internal) - Lines: 150-180
```

#### Examples
```bash
# List all functions
function-indexer list

# List only exported async functions
function-indexer list --exported --async

# Filter by path and save as CSV
function-indexer list --filter "src/auth/**" --format csv --output auth-functions.csv

# Sort by complexity
function-indexer list --sort complexity --format json
```

#### AI Integration Notes
- **Use for inventories**: Generate complete function lists for documentation
- **Combine filters**: Multiple filters work with AND logic
- **CSV for analysis**: Export to CSV for spreadsheet analysis
- **Memory efficient**: Streams output, handles large codebases

---

## 📊 Metrics Commands (Medium Priority)

### `metrics`

**Purpose**: Display code quality metrics overview and identify high-risk functions  
**Category**: Metrics  
**Priority**: Medium  
**AI Usage**: Code quality assessment, identify refactoring targets

#### Syntax
```bash
function-indexer metrics [options]
```

#### Options
- `--details, -d` - Show detailed function-level metrics (boolean)
- `--threshold <metric:value>` - Custom threshold (string, repeatable)
- `--format <type>` - Output format: text|json|html (string, default: text)
- `--output <file>` - Save report to file (string)

#### Output Format
Summary view:
```
📊 Code Quality Metrics

📈 Summary
   Total Functions: 216
   Average Complexity: 3.4
   Functions Exceeding Thresholds: 12

📊 Distribution
   🟢 Low Risk: 180 (83%)
   🟡 Medium Risk: 24 (11%)
   🔴 High Risk: 12 (6%)

⚠️  Top Issues:
   1. src/core/processor.ts:processData
      - Cyclomatic complexity: 15 (threshold: 10)
      - Lines of code: 115 (threshold: 50)
```

JSON format (`--format json`):
```json
{
  "summary": {
    "totalFunctions": 216,
    "averageComplexity": 3.4,
    "violationCount": 12
  },
  "distribution": {
    "low": 180,
    "medium": 24,
    "high": 12
  },
  "violations": [
    {
      "function": "processData",
      "file": "src/core/processor.ts",
      "violations": [
        { "metric": "cyclomaticComplexity", "value": 15, "threshold": 10 }
      ]
    }
  ]
}
```

#### Examples
```bash
# Basic metrics overview
function-indexer metrics

# Detailed metrics with custom thresholds
function-indexer metrics --details --threshold complexity:8 --threshold lines:40

# Generate HTML report
function-indexer metrics --format html --output metrics-report.html
```

#### AI Integration Notes
- **Risk assessment**: Use distribution to gauge overall code health
- **Prioritize by violations**: Focus on functions with multiple violations
- **Threshold tuning**: Adjust thresholds based on project standards
- **Trend tracking**: Compare metrics over time using collect-metrics

---

### `collect-metrics`

**Purpose**: Collect and store metrics for historical tracking and trend analysis  
**Category**: Metrics  
**Priority**: Medium  
**AI Usage**: Build metrics history, track quality over time

#### Syntax
```bash
function-indexer collect-metrics [options]
```

#### Options
- `--root <path>` - Root directory (string, default: ./src)
- `--pr <number>` - PR number for tracking (number)
- `--commit <hash>` - Specific commit hash (string, default: HEAD)
- `--branch <name>` - Branch name (string, default: current)
- `--verbose` - Verbose output (boolean)

#### Output Format
Console output:
```
📊 Collecting function metrics...
✅ Processed 45 files, 216 functions
📈 Metrics stored in database
🔍 New violations detected: 3
```

Database storage (SQLite):
- Location: `.function-metrics/metrics.db`
- Schema includes: function_id, timestamp, all metrics, commit info

#### Examples
```bash
# Collect metrics for current state
function-indexer collect-metrics

# Collect for specific PR
function-indexer collect-metrics --pr 123

# Collect for specific commit
function-indexer collect-metrics --commit abc123 --branch feature-x
```

#### AI Integration Notes
- **CI/CD integration**: Run on every commit for continuous tracking
- **PR tracking**: Always include --pr in pull request contexts
- **Database location**: Check `.function-metrics/metrics.db` exists
- **Performance**: Incremental collection, only changed functions

---

### `show-metrics`

**Purpose**: Display historical metrics for specific functions  
**Category**: Metrics  
**Priority**: Medium  
**AI Usage**: Track function evolution, identify degradation patterns

#### Syntax
```bash
function-indexer show-metrics [functionId] [options]
```

#### Arguments
- `functionId` - Function identifier as "file:function" (optional)

#### Options
- `--limit <number>` - Number of history entries (number, default: 10)
- `--list` - List all functions with metrics (boolean)

#### Output Format
Function history:
```
📈 Metrics history for: src/core/processor.ts:processData

1. 2024-01-15 10:30:00 (commit: abc123)
   Branch: main | PR: #45
   Cyclomatic: 12 → 15 (⬆️ +3)
   Lines: 98 → 115 (⬆️ +17)
   Cognitive: 18 → 22 (⬆️ +4)

2. 2024-01-10 14:20:00 (commit: def456)
   Branch: feature-x
   Cyclomatic: 10 → 12 (⬆️ +2)
   Lines: 89 → 98 (⬆️ +9)
```

#### Examples
```bash
# Show metrics for specific function
function-indexer show-metrics "src/auth.ts:validateToken"

# List all tracked functions
function-indexer show-metrics --list

# Show extended history
function-indexer show-metrics "src/core.ts:main" --limit 50
```

#### AI Integration Notes
- **Trend detection**: Look for consistent increases in complexity
- **PR correlation**: Use PR numbers to correlate with changes
- **Function naming**: Use exact "file:function" format
- **Missing data**: Returns empty if function not tracked

---

### `analyze-trends`

**Purpose**: Analyze metrics trends across the codebase  
**Category**: Metrics  
**Priority**: Medium  
**AI Usage**: Identify systemic issues, guide refactoring priorities

#### Syntax
```bash
function-indexer analyze-trends [options]
```

#### Options
- `--period <days>` - Analysis period in days (number, default: 30)
- `--min-change <percent>` - Minimum change percentage (number, default: 10)

#### Output Format
```
📊 Metrics Trend Analysis (Last 30 days)

🔴 Degrading Functions (5)
1. src/api/handler.ts:processRequest
   Complexity: 8 → 14 (+75%)
   Trend: Steadily increasing

🟢 Improving Functions (3)
1. src/utils/validator.ts:checkInput
   Complexity: 12 → 7 (-42%)
   Trend: Refactored in PR #89

📈 Overall Trends
- Average complexity: 3.2 → 3.8 (+19%)
- High-risk functions: 8 → 12 (+50%)
- Code coverage: 78% → 82% (+4%)
```

#### Examples
```bash
# Analyze last 30 days
function-indexer analyze-trends

# Analyze last quarter with significant changes
function-indexer analyze-trends --period 90 --min-change 20
```

#### AI Integration Notes
- **Focus on degrading**: Prioritize functions with negative trends
- **Correlation with PRs**: Check PR numbers for context
- **Systemic issues**: Multiple degrading functions may indicate architectural problems

---

### `pr-metrics`

**Purpose**: Show metrics changes for a specific pull request  
**Category**: Metrics  
**Priority**: Medium  
**AI Usage**: PR review support, quality gate checks

#### Syntax
```bash
function-indexer pr-metrics <prNumber>
```

#### Arguments
- `prNumber` - Pull request number (required)

#### Output Format
```
📊 Metrics for PR #123

📈 Summary
- Functions changed: 12
- New violations: 3
- Resolved violations: 1

🔴 New Issues
1. src/api/newEndpoint.ts:handleRequest
   - Cyclomatic complexity: 12 (exceeds threshold: 10)
   - Missing return type annotation

🟢 Improvements
1. src/utils/helper.ts:formatData
   - Complexity reduced: 8 → 4
```

#### Examples
```bash
# Show PR metrics
function-indexer pr-metrics 123
```

#### AI Integration Notes
- **Quality gates**: Check for new violations before approval
- **Review focus**: Direct reviewers to high-complexity additions
- **CI integration**: Use in PR checks for automatic quality gates

---

## 🔧 Development Commands (Medium Priority)

### `diff`

**Purpose**: Compare function changes between commits, branches, or index files  
**Category**: Development  
**Priority**: Medium  
**AI Usage**: Code review, impact analysis, change tracking

#### Syntax
```bash
function-indexer diff [base] [target] [options]
```

#### Arguments
- `base` - Base reference (commit/branch/file, default: main)
- `target` - Target reference (commit/branch/file, default: HEAD)

#### Options
- `--format <type>` - Output format: text|json|html (string, default: text)
- `--filter <pattern>` - Filter by file pattern (string)
- `--only-changes` - Show only changed functions (boolean)

#### Output Format
```
📊 Function Diff: main...feature-branch

➕ Added (3 functions)
  src/auth/newAuth.ts:validateAPIKey
  src/auth/newAuth.ts:refreshToken
  src/utils/crypto.ts:hashPassword

➖ Removed (1 function)
  src/auth/oldAuth.ts:legacyAuth

🔄 Modified (5 functions)
  src/core/processor.ts:processData
    Complexity: 8 → 12 (+4)
    Lines: 45 → 67 (+22)
    Signature changed: added optional parameter
```

#### Examples
```bash
# Compare with main branch
function-indexer diff

# Compare specific branches
function-indexer diff main feature-branch

# Compare index files
function-indexer diff old-index.jsonl new-index.jsonl

# Filter by path
function-indexer diff --filter "src/auth/**" --only-changes
```

#### AI Integration Notes
- **Change impact**: Use added/removed counts for impact assessment
- **Complexity increases**: Flag functions with growing complexity
- **Signature changes**: May indicate breaking changes
- **Performance**: Compares 10k functions in <500ms

---

### `report`

**Purpose**: Generate comprehensive code quality reports  
**Category**: Development  
**Priority**: Medium  
**AI Usage**: Documentation generation, quality reporting

#### Syntax
```bash
function-indexer report [options]
```

#### Options
- `--format <type>` - Report format: markdown|html|pdf (string, default: markdown)
- `--output <file>` - Output file path (string, required)
- `--include-metrics` - Include detailed metrics (boolean, default: true)
- `--include-trends` - Include trend analysis (boolean, default: false)

#### Output Format
Generates formatted report with:
- Executive summary
- Metrics overview
- High-risk functions
- Complexity distribution
- Recommendations

#### Examples
```bash
# Generate markdown report
function-indexer report --format markdown --output quality-report.md

# Generate HTML report with trends
function-indexer report --format html --output report.html --include-trends

# Quick PDF summary
function-indexer report --format pdf --output summary.pdf --no-include-metrics
```

#### AI Integration Notes
- **Automation**: Schedule weekly/monthly report generation
- **Stakeholder communication**: Use HTML/PDF for non-technical audiences
- **PR documentation**: Generate reports for significant PRs
- **Customization**: Reports use templates in `.function-indexer/templates/`

---

### `ci`

**Purpose**: CI/CD integration with configurable quality gates  
**Category**: Development  
**Priority**: Medium  
**AI Usage**: Automated quality checks, PR validation

#### Syntax
```bash
function-indexer ci [options]
```

#### Options
- `--format <type>` - CI format: github|gitlab|jenkins|azure (string, default: github)
- `--fail-on-violation` - Exit with error on violations (boolean, default: true)
- `--comment` - Post results as PR comment (boolean, default: false)
- `--baseline <file>` - Baseline metrics file for comparison (string)

#### Output Format
GitHub Actions format:
```
::error file=src/core/processor.ts,line=45::Function 'processData' exceeds complexity threshold (15 > 10)
::warning file=src/api/handler.ts,line=23::Function 'handleRequest' has high nesting depth (5 > 4)
```

Exit codes:
- 0: All checks passed
- 1: Violations found (when --fail-on-violation)
- 2: Error during analysis

#### Examples
```bash
# GitHub Actions
function-indexer ci --format github --fail-on-violation

# GitLab CI with PR comment
function-indexer ci --format gitlab --comment

# Compare with baseline
function-indexer ci --baseline .metrics-baseline.json
```

#### AI Integration Notes
- **Exit codes**: Use for conditional CI steps
- **Format selection**: Auto-detected from CI environment variables
- **Baseline comparison**: Prevents gradual degradation
- **Performance**: Optimized for CI, minimal output

---

### `generate-descriptions`

**Purpose**: Generate AI descriptions for functions using LLM  
**Category**: Development  
**Priority**: Low  
**AI Usage**: Documentation generation, code understanding

#### Syntax
```bash
function-indexer generate-descriptions [options]
```

#### Options
- `--input <file>` - Input index file (string, default: function-index.jsonl)
- `--output <file>` - Output file with descriptions (string, default: enhanced.jsonl)
- `--batch-size <number>` - LLM batch size (number, default: 10)
- `--model <name>` - LLM model to use (string, default: from env)

#### Output Format
Enhanced JSONL with description field:
```json
{
  "file": "src/auth.ts",
  "identifier": "validateToken",
  "description": "Validates JWT tokens by checking signature, expiration, and claims. Returns true if valid, false otherwise. Throws on malformed tokens.",
  "signature": "async function validateToken(token: string): Promise<boolean>",
  // ... other fields
}
```

#### Examples
```bash
# Generate with defaults
function-indexer generate-descriptions

# Custom model and batch size
function-indexer generate-descriptions --model gpt-4 --batch-size 20

# Specific input/output
function-indexer generate-descriptions --input index.jsonl --output described.jsonl
```

#### AI Integration Notes
- **API key required**: Set OPENAI_API_KEY or ANTHROPIC_API_KEY
- **Cost consideration**: ~$0.01 per 100 functions with GPT-3.5
- **Batch processing**: Adjustable for rate limits
- **Incremental**: Only processes functions without descriptions

---

## 🛠️ Management Commands (Low Priority)

### `validate`

**Purpose**: Validate index integrity and check for inconsistencies  
**Category**: Management  
**Priority**: Low  
**AI Usage**: Maintenance tasks, troubleshooting

#### Syntax
```bash
function-indexer validate [options]
```

#### Options
- `--input <file>` - Index file to validate (string, default: auto-detected)
- `--fix` - Attempt to fix issues (boolean, default: false)
- `--verbose` - Show detailed validation info (boolean)

#### Output Format
```
🔍 Validating index: .function-indexer/index.jsonl

✅ Format validation: PASSED
✅ Hash verification: PASSED
⚠️  File existence: 2 missing files
❌ Duplicate entries: 3 duplicates found

Summary: 2 warnings, 1 error
Run with --fix to attempt repairs
```

#### Examples
```bash
# Basic validation
function-indexer validate

# Validate and fix
function-indexer validate --fix --verbose

# Validate specific file
function-indexer validate --input old-index.jsonl
```

#### AI Integration Notes
- **Regular maintenance**: Run weekly in CI
- **Pre-migration check**: Validate before major updates
- **Error recovery**: Use --fix for automatic repairs
- **Performance**: Validates 100k entries in <5s

---

### `repair`

**Purpose**: Repair corrupted or incomplete index files  
**Category**: Management  
**Priority**: Low  
**AI Usage**: Error recovery, maintenance

#### Syntax
```bash
function-indexer repair [options]
```

#### Options
- `--input <file>` - File to repair (string, default: auto-detected)
- `--output <file>` - Repaired file output (string, default: input.repaired)
- `--strategy <type>` - Repair strategy: safe|aggressive (string, default: safe)

#### Output Format
```
🔧 Repairing index file...

Issues found:
- Malformed JSON: 3 lines
- Missing required fields: 5 entries
- Invalid file paths: 2 entries

Repair actions:
✅ Removed 3 malformed lines
✅ Fixed 5 entries with defaults
✅ Updated 2 file paths

Repaired file saved to: index.jsonl.repaired
```

#### Examples
```bash
# Safe repair (default)
function-indexer repair

# Aggressive repair with custom output
function-indexer repair --strategy aggressive --output fixed-index.jsonl
```

#### AI Integration Notes
- **Data loss prevention**: Safe mode preserves questionable data
- **Backup first**: Always creates .backup before repair
- **Validation after**: Run validate after repair
- **Last resort**: Try validate --fix first

---

### `backup`

**Purpose**: Create backup of index and configuration  
**Category**: Management  
**Priority**: Low  
**AI Usage**: Data protection, version management

#### Syntax
```bash
function-indexer backup [options]
```

#### Options
- `--output <path>` - Backup destination (string, default: .function-indexer/backups/)
- `--include-metrics` - Include metrics database (boolean, default: true)
- `--compress` - Create compressed archive (boolean, default: true)

#### Output Format
```
📦 Creating backup...

Included files:
✅ Configuration: config.json
✅ Index: index.jsonl (2.3 MB)
✅ Metrics: metrics.db (5.1 MB)

Backup created: .function-indexer/backups/backup-2024-01-15-103000.tar.gz
Size: 1.8 MB (compressed from 7.4 MB)
```

#### Examples
```bash
# Default backup
function-indexer backup

# Uncompressed backup to specific location
function-indexer backup --output /backups/project/ --no-compress

# Configuration only
function-indexer backup --no-include-metrics
```

#### AI Integration Notes
- **Scheduled backups**: Daily in CI recommended
- **Before major changes**: Always backup before upgrades
- **Retention policy**: Keep last 7 daily, 4 weekly
- **Restore testing**: Periodically test restore process

---

### `restore`

**Purpose**: Restore from backup  
**Category**: Management  
**Priority**: Low  
**AI Usage**: Disaster recovery, rollback operations

#### Syntax
```bash
function-indexer restore <backup-file> [options]
```

#### Arguments
- `backup-file` - Path to backup file (required)

#### Options
- `--force` - Overwrite existing files (boolean, default: false)
- `--preview` - Show what would be restored (boolean, default: false)

#### Output Format
```
📥 Restoring from backup: backup-2024-01-15-103000.tar.gz

Backup contents:
- Configuration: 2 files
- Index: 45,231 functions
- Metrics: 30 days of history

⚠️  This will overwrite existing files. Continue? (y/N)

Restoring...
✅ Configuration restored
✅ Index restored
✅ Metrics database restored

Restore completed successfully!
```

#### Examples
```bash
# Preview restore
function-indexer restore backup-2024-01-15.tar.gz --preview

# Force restore
function-indexer restore backup-2024-01-15.tar.gz --force

# Restore from specific path
function-indexer restore /backups/emergency-backup.tar.gz
```

#### AI Integration Notes
- **Verification**: Always validate after restore
- **Partial restore**: Extract specific files if needed
- **Downgrade path**: Restore older version compatibility
- **Testing**: Test restore process regularly

---

### `update-all`

**Purpose**: Update all indexes in a multi-project workspace  
**Category**: Management  
**Priority**: Low  
**AI Usage**: Monorepo management, bulk operations

#### Syntax
```bash
function-indexer update-all [options]
```

#### Options
- `--root <path>` - Workspace root (string, default: current directory)
- `--parallel <number>` - Parallel jobs (number, default: CPU count)
- `--filter <pattern>` - Project filter pattern (string)

#### Output Format
```
🔄 Updating all projects in workspace...

Found 5 projects with function-indexer:
1. packages/core
2. packages/auth  
3. packages/api
4. apps/web
5. apps/mobile

Updating...
✅ packages/core: 156 functions (2.1s)
✅ packages/auth: 89 functions (1.3s)
✅ packages/api: 234 functions (3.2s)
✅ apps/web: 445 functions (5.1s)
✅ apps/mobile: 312 functions (4.2s)

Total: 1,236 functions indexed in 15.9s
```

#### Examples
```bash
# Update all projects
function-indexer update-all

# Update specific packages
function-indexer update-all --filter "packages/*"

# Sequential updates
function-indexer update-all --parallel 1
```

#### AI Integration Notes
- **Monorepo support**: Detects projects by config files
- **Performance**: Parallel processing by default
- **Partial updates**: Use filter for specific packages
- **CI optimization**: Cache unchanged projects

---

## 📊 Output Format Specifications

### JSONL Index Format

Each line in the index file is a JSON object with this schema:

```typescript
interface FunctionRecord {
  // File location
  file: string;              // Relative path from project root
  
  // Function identification  
  identifier: string;        // Function name (or <anonymous>)
  signature: string;         // Full function signature with types
  
  // Location in file
  startLine: number;         // Starting line number (1-based)
  endLine: number;           // Ending line number (inclusive)
  
  // Change tracking
  hash_function: string;     // 8-char hash of function content
  hash_file: string;         // 8-char hash of containing file
  
  // Function characteristics
  exported: boolean;         // Is exported/public
  async: boolean;            // Is async function
  
  // Metrics object
  metrics: {
    linesOfCode: number;         // Effective lines (no blanks/comments)
    cyclomaticComplexity: number; // Decision points + 1
    cognitiveComplexity: number;  // Understandability score
    nestingDepth: number;         // Maximum nesting level
    parameterCount: number;       // Number of parameters
    hasReturnType: boolean;       // Has explicit return type
  };
  
  // Optional fields
  domain?: string;           // Domain identifier
  description?: string;      // AI-generated description
}
```

### Error Response Format

All commands use consistent error reporting:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid configuration file",
    "details": {
      "file": ".function-indexer/config.json",
      "line": 5,
      "issue": "Missing required field: 'root'"
    }
  }
}
```

Error codes:
- `PARSE_ERROR`: Failed to parse TypeScript/TSX file
- `VALIDATION_ERROR`: Invalid configuration or input
- `FILE_NOT_FOUND`: Required file missing
- `PERMISSION_DENIED`: Insufficient permissions
- `INTERNAL_ERROR`: Unexpected error

---

## 🤖 AI Integration Best Practices

### Command Selection Guide

For AI assistants choosing commands:

1. **Project initialization**: Always start with `function-indexer`
2. **Discovery tasks**: Use `search` with natural language
3. **Quality checks**: Run `metrics` before suggesting changes
4. **Change tracking**: Use `diff` for impact analysis
5. **CI/CD integration**: Implement `ci` with appropriate format

### Output Processing Tips

1. **JSONL parsing**: Process line-by-line for memory efficiency
2. **Score thresholds**: 
   - Search: relevance > 0.5 for meaningful results
   - Metrics: focus on violations first
3. **Error handling**: Check error.code for specific recovery
4. **Incremental processing**: Use hashes to detect changes

### Performance Considerations

| Operation | Scale | Expected Time |
|-----------|-------|---------------|
| Indexing | 1,000 files | ~1 second |
| Search | 100,000 functions | <100ms |
| Metrics | 10,000 functions | ~500ms |
| Diff | 50,000 functions | ~1 second |

### Common Workflows

```bash
# 1. Initial project analysis
function-indexer
function-indexer metrics
function-indexer list --exported --format json

# 2. Finding specific functionality  
function-indexer search "user authentication"
function-indexer search "validate" --context "email"

# 3. PR quality check
function-indexer diff main HEAD
function-indexer metrics --details
function-indexer ci --fail-on-violation

# 4. Regular maintenance
function-indexer validate
function-indexer backup
function-indexer analyze-trends
```

---

## 📚 Additional Resources

- **Configuration Guide**: `.function-indexer/config.json` schema
- **API Documentation**: Programmatic usage via Node.js
- **GitHub Integration**: Actions and workflows
- **Troubleshooting**: Common issues and solutions

For AI assistants: This reference is optimized for machine parsing. Each command section follows a consistent structure for reliable information extraction.