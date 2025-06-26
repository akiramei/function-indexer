# 🤖 Function Indexer - AI Master Guide

**Version 1.0** | **Comprehensive AI Assistant Reference**

## Executive Summary

Function Indexer is a professional TypeScript CLI tool designed for AI-assisted code quality management. It scans codebases, extracts structured function metadata with quality metrics, and provides comprehensive tools for phase-based development tracking and automated quality gates.

**Key Value Propositions**:
- **Zero-configuration startup** - Works immediately with sensible defaults
- **Phase-based quality management** - Track quality changes across development phases
- **AI-optimized outputs** - JSONL format for easy AI processing
- **Enterprise-ready** - CI/CD integration, custom thresholds, comprehensive reporting

## Quick Start Guide

### Prerequisites
```bash
# Linux/WSL users only
sudo apt update && sudo apt install build-essential python3
```

### Immediate Usage
```bash
# Scan current project (zero configuration)
npx @akiramei/function-indexer

# Scan specific directory with output
npx @akiramei/function-indexer --root ./src --output functions.jsonl

# Quality overview
npx @akiramei/function-indexer metrics --details

# Search functions
npx @akiramei/function-indexer search "authentication" --context "login"
```

## Core Architecture Understanding

### Data Flow
```
TypeScript/TSX Files → AST Analysis → Function Extraction → Metrics Calculation → JSONL Output
                                                        ↓
                                                 SQLite Database (for trends)
```

### Key Components
- **Indexer Engine**: ts-morph-based AST parsing for accurate function extraction
- **Metrics Engine**: Calculates 6 key code quality metrics with configurable thresholds
- **Configuration System**: Separated core and metrics configs for modularity
- **Database System**: SQLite for historical tracking and trend analysis
- **Reporting System**: Multiple output formats (terminal, markdown, HTML, JSON)

### Configuration Architecture (New: v1.1.0)
Function Indexer now uses a **separated configuration system**:

```
.function-indexer/
├── config.json          # Core configuration (indexing, file patterns)
└── metrics-config.json  # Metrics configuration (thresholds, tracking)
```

**Benefits**: Modular settings, independent updates, performance optimization, better maintainability.

## Function Record Schema

Each function is represented as a comprehensive record:

```typescript
interface FunctionRecord {
  file: string;          // Relative file path
  identifier: string;    // Function name (class.method for methods)
  signature: string;     // Complete function signature
  startLine: number;     // Starting line number
  endLine: number;       // Ending line number
  hash_function: string; // Content hash (8 chars) for change detection
  hash_file: string;     // File hash (8 chars) for file-level tracking
  exported: boolean;     // Export status
  async: boolean;        // Async function indicator
  metrics: {
    linesOfCode: number;           // Effective lines (excludes braces/comments)
    cyclomaticComplexity: number;  // Decision points (if/for/while/case)
    cognitiveComplexity: number;   // Human comprehension difficulty
    nestingDepth: number;          // Maximum nesting level
    parameterCount: number;        // Function parameter count
    hasReturnType: boolean;        // TypeScript return type annotation
  };
  domain: string;        // Optional domain classification
}
```

## Command Reference for AI Assistants

### 1. Index Generation (Core Command)
```bash
npx @akiramei/function-indexer [options]
```
**Purpose**: Generate comprehensive function index in JSONL format
**AI Use Cases**: Codebase analysis, function discovery, change tracking
**Options**:
- `--root, -r`: Directory to scan (auto-detected if omitted)
- `--output, -o`: Output file path (auto-generated if omitted)
- `--domain`: Logical domain for function classification
- `--verbose, -v`: Detailed progress output

### 2. Function Search
```bash
npx @akiramei/function-indexer search <query> [options]
```
**Purpose**: Natural language and pattern-based function discovery
**AI Use Cases**: Code exploration, similar function finding, functionality location
**Advanced Examples**:
```bash
# Multi-context search
npx @akiramei/function-indexer search "validation" --context "user input security"

# Pattern-based search
npx @akiramei/function-indexer search "handle*Error" --limit 20

# Complex functionality search
npx @akiramei/function-indexer search "database operations" --context "async transactions"
```

### 3. Quality Analysis
```bash
npx @akiramei/function-indexer metrics [--details]
```
**Purpose**: Code quality overview and violation detection
**AI Use Cases**: Quality assessment, refactoring prioritization, technical debt identification

**Output Interpretation**:
- Functions above thresholds require immediate attention
- Average complexity trends indicate overall code health
- Distribution patterns reveal architectural quality

### 4. Historical Tracking
```bash
# Collect metrics with PR association
npx @akiramei/function-indexer collect-metrics --root ./src --pr 123 --verbose

# View function evolution
npx @akiramei/function-indexer show-metrics "src/auth.ts:validateToken" --limit 10

# Trend analysis
npx @akiramei/function-indexer analyze-trends
```

### 5. Comparative Analysis
```bash
# Branch/commit comparison
npx @akiramei/function-indexer diff main feature-branch --format markdown --output changes.md

# Phase comparison (using tags)
npx @akiramei/function-indexer diff phase-1-complete phase-2-complete --format json
```

### 6. Reporting & Documentation
```bash
# Executive HTML dashboard
npx @akiramei/function-indexer report --format html --output quality-dashboard.html

# Technical markdown report
npx @akiramei/function-indexer report --format markdown --output technical-analysis.md

# Data export for external tools
npx @akiramei/function-indexer report --format json --output metrics-export.json
```

### 7. CI/CD Integration
```bash
# GitHub Actions integration
npx @akiramei/function-indexer ci --format github --base main --fail-on-violation

# Custom quality gates
npx @akiramei/function-indexer ci --thresholds '{"cyclomaticComplexity":8}' --fail-on-violation
```

## Quality Metrics Deep Dive

### Metric Definitions & Thresholds

| Metric | Description | Good | Warning | Critical | AI Interpretation |
|--------|-------------|------|---------|----------|------------------|
| **Cyclomatic Complexity** | Decision points (if/for/while/case) | ≤5 | 6-10 | >10 | Linear paths through code |
| **Cognitive Complexity** | Human comprehension difficulty | ≤8 | 9-15 | >15 | Mental load to understand |
| **Lines of Code** | Effective lines (excludes braces) | ≤20 | 21-40 | >40 | Function size indicator |
| **Nesting Depth** | Maximum nesting level | ≤2 | 3 | >3 | Code structure complexity |
| **Parameter Count** | Function parameter count | ≤3 | 4 | >4 | Interface complexity |
| **Return Type** | TypeScript return annotation | Present | - | Missing | Type safety indicator |

### Custom Threshold Configuration
```json
{
  "thresholds": {
    "cyclomaticComplexity": 8,     // Enterprise: stricter
    "cognitiveComplexity": 12,     // Enterprise: stricter  
    "linesOfCode": 30,             // Moderate functions
    "nestingDepth": 3,             // Allow some nesting
    "parameterCount": 3            // Clean interfaces
  }
}
```

## AI Workflow Patterns

### Pattern 1: Codebase Understanding & Analysis
```bash
# Step 1: Get overview
npx @akiramei/function-indexer metrics

# Step 2: Find complex areas
npx @akiramei/function-indexer metrics --details

# Step 3: Explore specific domains
npx @akiramei/function-indexer search "authentication" --context "security patterns"

# Step 4: Identify entry points
npx @akiramei/function-indexer search "main" --context "application entry"
```

**AI Assistant Response Pattern**:
1. Summarize overall quality metrics
2. Highlight functions exceeding thresholds
3. Identify architectural patterns
4. Suggest exploration paths

### Pattern 2: Code Review & Quality Gates
```bash
# Step 1: Generate baseline
npx @akiramei/function-indexer --root ./src

# Step 2: Compare changes
npx @akiramei/function-indexer diff main HEAD --format markdown

# Step 3: Quality assessment
npx @akiramei/function-indexer ci --base main --format github

# Step 4: Collect metrics
npx @akiramei/function-indexer collect-metrics --pr $PR_NUMBER
```

**AI Assistant Response Pattern**:
1. Identify new/modified functions
2. Assess quality impact
3. Flag violations and risks
4. Provide specific improvement recommendations

### Pattern 3: Refactoring Planning
```bash
# Step 1: Find refactoring candidates
npx @akiramei/function-indexer metrics --details

# Step 2: Analyze complexity distribution
npx @akiramei/function-indexer report --format json | jq '.functions[] | select(.metrics.cyclomaticComplexity > 10)'

# Step 3: Find similar patterns
npx @akiramei/function-indexer search "similar functionality patterns"

# Step 4: Track improvements
npx @akiramei/function-indexer show-metrics "target-function" --limit 10
```

### Pattern 4: Phase-Based Quality Management
```bash
# Phase baseline establishment
git tag phase-1-baseline
npx @akiramei/function-indexer collect-metrics --root ./src
npx @akiramei/function-indexer report --format html --output phase1-quality.html

# Phase comparison and analysis
git tag phase-2-complete
npx @akiramei/function-indexer diff phase-1-baseline phase-2-complete --format markdown --output phase-comparison.md
npx @akiramei/function-indexer analyze-trends
```

## Advanced AI Integration Scenarios

### Scenario 1: Technical Debt Assessment
```bash
# Comprehensive debt analysis
npx @akiramei/function-indexer report --format json --output debt-analysis.json
npx @akiramei/function-indexer analyze-trends

# AI Processing:
# - Parse JSON for high-complexity functions
# - Calculate technical debt score
# - Prioritize refactoring based on business impact
# - Generate improvement roadmap
```

### Scenario 2: Code Quality Monitoring
```bash
# Continuous quality tracking
npx @akiramei/function-indexer collect-metrics --root ./src --pr $PR_NUMBER
npx @akiramei/function-indexer show-metrics --list | grep "violation"

# AI Processing:
# - Track quality trends over time
# - Identify degradation patterns
# - Alert on threshold violations
# - Suggest preventive measures
```

### Scenario 3: Architecture Analysis
```bash
# Domain-based analysis
npx @akiramei/function-indexer --root ./src --domain "authentication"
npx @akiramei/function-indexer search "*" --context "architecture patterns"

# AI Processing:
# - Identify architectural boundaries
# - Analyze coupling between components
# - Suggest architectural improvements
# - Validate design principles adherence
```

## Configuration Management

### Core Configuration (`.function-indexer/config.json`)
```json
{
  "version": "1.1.0",
  "root": "./src",
  "output": "function-index.jsonl",
  "domain": "main",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "node_modules/**"]
}
```

### Metrics Configuration (`.function-indexer/metrics-config.json`)
```json
{
  "version": "1.1.0",
  "enabled": true,
  "database": {
    "path": ".function-metrics/metrics.db",
    "autoCleanup": false,
    "maxHistoryDays": 365
  },
  "thresholds": {
    "cyclomaticComplexity": 10,
    "cognitiveComplexity": 15,
    "linesOfCode": 50,
    "nestingDepth": 4,
    "parameterCount": 4
  },
  "collection": {
    "autoCollectOnCommit": false,
    "includeUncommitted": true,
    "trackTrends": true
  },
  "reporting": {
    "defaultFormat": "summary",
    "showTrends": true,
    "highlightViolations": true
  }
}
```

### Migration & Backward Compatibility
- **Automatic migration** from legacy single-config format
- **Backup creation** during migration
- **100% backward compatibility** maintained
- **Transparent operation** - no user intervention required

## Output Processing for AI Systems

### JSONL Processing Patterns
```javascript
// Node.js example for processing function data
const fs = require('fs');
const readline = require('readline');

async function processIndex(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream });
  
  const functions = [];
  for await (const line of rl) {
    const func = JSON.parse(line);
    functions.push(func);
  }
  
  return functions;
}

// Filter high-complexity functions
const complexFunctions = functions.filter(f => 
  f.metrics.cyclomaticComplexity > 10 || 
  f.metrics.cognitiveComplexity > 15
);

// Group by file for architectural analysis
const byFile = functions.reduce((acc, func) => {
  if (!acc[func.file]) {
    acc[func.file] = [];
  }
  acc[func.file].push(func);
  return acc;
}, {} as Record<string, any[]>);
```

### Python Integration Example
```python
import json
import pandas as pd

def analyze_functions(jsonl_path):
    functions = []
    with open(jsonl_path, 'r') as f:
        for line in f:
            functions.append(json.loads(line))
    
    df = pd.DataFrame(functions)
    
    # Quality analysis
    high_complexity = df[df['metrics.cyclomaticComplexity'] > 10]
    
    # Architectural insights
    files_by_complexity = df.groupby('file')['metrics.cyclomaticComplexity'].mean()
    
    return {
        'total_functions': len(df),
        'high_complexity_count': len(high_complexity),
        'average_complexity': df['metrics.cyclomaticComplexity'].mean(),
        'files_by_complexity': files_by_complexity.to_dict()
    }
```

## CI/CD Integration Patterns

### GitHub Actions Integration
```yaml
name: Code Quality Analysis
on: [push, pull_request]

jobs:
  quality-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Required for diff analysis
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install system dependencies
        run: sudo apt update && sudo apt install build-essential python3
      
      - name: Analyze code quality
        run: |
          npx @akiramei/function-indexer collect-metrics --root ./src --pr ${{ github.event.number }}
          npx @akiramei/function-indexer ci --format github --base main --fail-on-violation
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GitLab CI Integration
```yaml
code-quality:
  stage: test
  image: node:18
  before_script:
    - apt-get update && apt-get install -y build-essential python3
  script:
    - npx @akiramei/function-indexer collect-metrics --root ./src --pr $CI_MERGE_REQUEST_IID
    - npx @akiramei/function-indexer ci --format gitlab --comment --base main
  artifacts:
    reports:
      junit: quality-report.xml
```

## Troubleshooting & Common Issues

### Performance Optimization
- **Large codebases**: Use `--exclude` patterns to skip unnecessary files
- **Memory issues**: Process directories in smaller chunks
- **Slow analysis**: Exclude test files and node_modules

### Error Resolution
- **Parse errors**: Check for TypeScript syntax errors in source files
- **Missing functions**: Verify `--include` patterns match your file structure
- **Database locks**: Ensure only one process accesses metrics database at a time

### Best Practices
1. **Always run main command first** to generate fresh index data
2. **Use specific `--root` paths** to limit analysis scope
3. **Store JSONL output** for post-processing and analysis
4. **Configure custom thresholds** based on project requirements
5. **Integrate with CI/CD** for automated quality gates

## Expert Tips for AI Assistants

### Effective Analysis Patterns
1. **Start with overview** (`metrics`) before diving into details
2. **Use search strategically** with specific contexts for better results  
3. **Leverage diff command** for understanding changes over time
4. **Combine multiple metrics** for comprehensive quality assessment
5. **Export data** (`--format json`) for advanced analysis

### Response Templates
When helping users with Function Indexer:

**For Quality Assessment**:
1. Run metrics overview
2. Identify threshold violations
3. Suggest specific improvements
4. Provide implementation guidance

**For Architecture Analysis**:
1. Generate comprehensive index
2. Analyze complexity distribution
3. Identify coupling patterns
4. Suggest architectural improvements

**For Refactoring Planning**:
1. Find high-complexity functions
2. Analyze change history
3. Identify similar patterns
4. Prioritize improvements

## Version History & Updates

**v1.1.0** (Current)
- Separated configuration system (core + metrics configs)
- Enhanced metrics collection with PR tracking
- Improved CI/CD integration
- Better error handling and performance

**v1.0.0**
- Initial comprehensive implementation
- Full metrics suite with SQLite storage
- Multi-format reporting (terminal, markdown, HTML, JSON)
- Search functionality with natural language support

---

*This AI Master Guide represents the definitive reference for AI assistants working with Function Indexer. For technical implementation details, refer to CLAUDE.md. For user-facing documentation, see README.md.*