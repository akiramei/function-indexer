# 🤖 Function Indexer - AI Integration Guide

**Comprehensive AI Assistant Reference** | **Version 1.1**

## Executive Summary

Function Indexer is a professional TypeScript CLI tool designed for AI-assisted code quality management. It scans codebases, extracts structured function metadata with quality metrics, and provides comprehensive tools for development tracking and automated quality gates.

**Key Value Propositions**:
- **Zero-configuration startup** - Works immediately with sensible defaults
- **AI-optimized outputs** - JSONL format for easy AI processing
- **Phase-based quality management** - Track quality changes across development phases
- **Enterprise-ready** - CI/CD integration, custom thresholds, comprehensive reporting

## Quick Start for AI Assistants

When asked to "manage code quality using Function Indexer", follow these steps:

1. **Run initial scan** to establish baseline
2. **Update metrics regularly** to track changes
3. **Review quality reports** for violations
4. **Configure CI/CD integration** for automated checks
5. **Create regular reports** for code review

### Prerequisites
```bash
# Linux/WSL users only
sudo apt update && sudo apt install build-essential python3
```

### Immediate Usage
```bash
# Initialize project and create function index (first time)
npx github:akiramei/function-indexer

# Update metrics after code changes (recommended)
npx github:akiramei/function-indexer         # Updates both index and metrics
fx                                           # Short alias for above

# Check quality overview
npx github:akiramei/function-indexer metrics trends
fx metrics trends

# Search functions
npx github:akiramei/function-indexer search "authentication" --context "login"
fx s "authentication"
```

## Core Capabilities

- **Function Discovery**: Finds all functions in TypeScript/TSX files
- **Metrics Analysis**: Calculates complexity, lines of code, nesting depth
- **Search**: Natural language and pattern-based function search
- **Change Tracking**: Detects modifications via content hashing
- **Quality Monitoring**: Tracks code quality trends over time

## Architecture Understanding

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

## Installation Options

### Option 1: Direct npx Usage (Recommended)
```bash
# Run directly with npx (no installation needed)
npx github:akiramei/function-indexer

# Scan specific directory with output file  
npx github:akiramei/function-indexer --root ./src --output functions.jsonl

# Collect metrics for PR (NEW command structure)
npx github:akiramei/function-indexer metrics collect --root ./src --pr 123
```

### Option 2: Local Project Installation
```bash
# Install locally to project
npm install --save-dev github:akiramei/function-indexer
npx function-indexer

# Alternative: npm package (if published)
npm install --save-dev @akiramei/function-indexer
npx function-indexer
```

## Command Reference

### 1. Core Indexing Commands

#### Main Function Index Generation
```bash
npx github:akiramei/function-indexer --root <path> --output <file> [options]

# Examples:
npx github:akiramei/function-indexer --root ./src --output functions.jsonl
npx github:akiramei/function-indexer --root ./lib --domain backend --verbose
```

**Options:**
- `--root <path>`: Source directory to scan (default: current directory)
- `--output <file>`: Output JSONL file (default: function-index.jsonl)
- `--domain <name>`: Optional domain classification
- `--include <patterns>`: File patterns to include (default: **/*.ts, **/*.tsx)
- `--exclude <patterns>`: File patterns to exclude (default: test files)
- `--verbose`: Enable detailed logging

#### Simplified Commands (v1.1.0+)
```bash
# Initialize or update function index
fx                              # Short alias for function-indexer

# Search functions with natural language
fx s "authentication logic"     # Short alias for search
fx search "user validation" --context "auth"

# List all functions with filters
fx ls                          # Short alias for list
fx list --file "src/auth.ts" --complexity ">10"

# Show metrics overview
fx m                           # Short alias for metrics
fx metrics                     # Show code quality overview
```

### 2. Metrics Commands

Function Indexer includes a comprehensive metrics system for tracking code quality over time:

#### Update/Initialize Metrics
```bash
# RECOMMENDED: Update metrics using main command (handles both initial setup and updates)
fx                                    # Updates function index AND metrics automatically
npx github:akiramei/function-indexer  # Same as above, updates both index and metrics

# Alternative: Manual metrics update
fx metrics collect --root ./src       # Updates metrics database only
```

#### Overview Commands
```bash
# View code quality overview
npx github:akiramei/function-indexer metrics
fx metrics

# Show detailed trends and violations
npx github:akiramei/function-indexer metrics trends
fx metrics trends
```

#### Collection Commands (Advanced)
```bash
# Collect metrics for specific tracking (advanced usage)
npx github:akiramei/function-indexer metrics collect --root ./src --pr 123 --verbose
fx metrics collect --root ./src --pr 123 --verbose

# Note: For regular updates, simply use 'fx' command instead
```

#### Analysis Commands
```bash
# Show function history and trends
npx github:akiramei/function-indexer metrics show "src/indexer.ts:FunctionIndexer.run"
fx metrics show "src/indexer.ts:FunctionIndexer.run" --limit 5

# View PR-specific metrics
npx github:akiramei/function-indexer metrics pr 123
fx metrics pr 123
```

### 3. Search and Discovery Commands

```bash
# Natural language search
npx github:akiramei/function-indexer search "authentication logic"
fx s "user validation"

# Pattern-based search
npx github:akiramei/function-indexer search --pattern "handle*Error"
fx search --pattern "validate*" --async-only

# List functions with filters
npx github:akiramei/function-indexer list --file "src/auth.ts"
fx ls --complexity ">10" --exported-only
```

## Quality Metrics System

### Supported Metrics
1. **Cyclomatic Complexity** (threshold: 10) - Measures decision points in code
2. **Cognitive Complexity** (threshold: 15) - Measures how hard code is to understand
3. **Lines of Code** (threshold: 50) - Counts effective lines excluding braces/comments
4. **Nesting Depth** (threshold: 4) - Maximum depth of control structures
5. **Parameter Count** (threshold: 4) - Number of function parameters
6. **Return Type Annotation** - Whether function has explicit return type

### Violation Detection
The system automatically flags functions exceeding thresholds:
```bash
# View all violations
fx metrics trends

# Example output:
# ⚠️  HIGH COMPLEXITY: src/parser.ts:parseExpression (complexity: 12, threshold: 10)
# ⚠️  LONG FUNCTION: src/indexer.ts:processFile (lines: 55, threshold: 50)
```

## Output Format Understanding

### JSONL Structure
Each line in the output contains a complete function record:

```typescript
interface FunctionRecord {
  file: string;          // Relative file path
  identifier: string;    // Function name
  signature: string;     // Full function signature
  startLine: number;     // Starting line number
  endLine: number;       // Ending line number
  hash_function: string; // Content hash (8 chars)
  hash_file: string;     // File hash (8 chars)
  exported: boolean;     // Is exported
  async: boolean;        // Is async function
  metrics: {
    linesOfCode: number;
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    nestingDepth: number;
    parameterCount: number;
    hasReturnType: boolean;
  };
  domain: string;        // User-specified domain (optional)
}
```

### Example Output
```json
{"file":"src/indexer.ts","identifier":"FunctionIndexer.run","signature":"async run(): Promise<void>","startLine":45,"endLine":78,"hash_function":"a1b2c3d4","hash_file":"e5f6g7h8","exported":true,"async":true,"metrics":{"linesOfCode":28,"cyclomaticComplexity":6,"cognitiveComplexity":8,"nestingDepth":2,"parameterCount":0,"hasReturnType":true},"domain":"main"}
```

## AI Workflow Patterns

### 1. Code Discovery & Analysis
```bash
# Step 1: Generate comprehensive function index
fx --root ./src --output analysis.jsonl

# Step 2: Search for specific functionality
fx s "error handling" --context "validation"

# Step 3: Analyze quality metrics
fx metrics trends
```

### 2. Quality Assessment
```bash
# Step 1: Update metrics (recommended approach)
fx                                        # Updates function index AND metrics

# Step 2: Identify violations
fx metrics trends

# Step 3: Analyze specific functions
fx metrics show "src/problematic.ts:complexFunction"
```

### 3. Change Tracking
```bash
# Step 1: Baseline collection (before changes)
fx                                        # Establishes current baseline

# Step 2: Make code changes
# ... development work ...

# Step 3: Update metrics after changes
fx                                        # Updates metrics with new changes
fx metrics trends                         # Shows what changed

# Optional: Track specific PR
fx metrics collect --root ./src --pr 123  # Advanced PR tracking
fx metrics pr 123                         # View PR-specific changes
```

### 4. PR Review Automation
```bash
# Pre-review preparation
fx                                        # Update current metrics
fx metrics collect --root ./src --pr 456  # Optional: Track specific PR

# Generate review insights
fx metrics trends                         # Show current violations
fx metrics pr 456                         # Show PR-specific changes (if tracked)

# Focus on quality violations
fx metrics trends                         # Identify all current issues
```

## Configuration System

Function Indexer uses a separated configuration system for modularity:

### Core Configuration (`.function-indexer/config.json`)
```json
{
  "version": "1.1.0",
  "root": "./src",
  "output": "function-index.jsonl",
  "domain": "main",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

### Metrics Configuration (`.function-indexer/metrics-config.json`)
```json
{
  "version": "1.1.0",
  "enabled": true,
  "thresholds": {
    "cyclomaticComplexity": 10,
    "cognitiveComplexity": 15,
    "linesOfCode": 50,
    "nestingDepth": 4,
    "parameterCount": 4
  },
  "database": {
    "path": ".function-metrics/metrics.db",
    "autoCleanup": false,
    "maxHistoryDays": 365
  }
}
```

## Advanced Integration Patterns

### 1. Custom Workflow Integration
```bash
#!/bin/bash
# quality-check.sh - Custom quality gate script

echo "🔍 Scanning codebase..."
fx --root ./src --output current-functions.jsonl

echo "📊 Collecting metrics..."
fx metrics collect --root ./src --pr $PR_NUMBER

echo "⚠️  Checking for violations..."
fx metrics trends --format json > violations.json

if [ -s violations.json ]; then
    echo "❌ Quality gate failed - violations detected"
    exit 1
else
    echo "✅ Quality gate passed"
    exit 0
fi
```

### 2. CI/CD Pipeline Integration
```yaml
# GitHub Actions example
name: Code Quality Check
on: [pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Function Indexer
        run: npm install -g github:akiramei/function-indexer
      
      - name: Collect Metrics
        run: fx metrics collect --root ./src --pr ${{ github.event.number }}
      
      - name: Check Quality Gates
        run: fx metrics trends --fail-on-violations
```

### 3. API Integration for Advanced Use Cases
```typescript
// For programmatic usage (if needed)
import { FunctionIndexer } from 'function-indexer';

const indexer = new FunctionIndexer({
  root: './src',
  include: ['**/*.ts', '**/*.tsx'],
  exclude: ['**/*.test.ts']
});

const results = await indexer.run();
console.log(`Found ${results.length} functions`);
```

## Troubleshooting Common Issues

### 1. Installation Issues
```bash
# Linux/WSL: Missing build tools
sudo apt update && sudo apt install build-essential python3

# Node.js version compatibility
node --version  # Should be >= 18.0.0
```

### 2. Parsing Errors
```bash
# Enable verbose logging to see details
fx --verbose --root ./src

# Check TypeScript configuration
npx tsc --noEmit  # Verify project compiles
```

### 3. Performance Issues
```bash
# Exclude unnecessary files
fx --root ./src --exclude "**/*.test.ts" --exclude "**/node_modules/**"

# Process smaller directories
fx --root ./src/core --output core-functions.jsonl
```

## Best Practices for AI Assistants

### 1. Progressive Analysis
- Start with `fx metrics` for overview
- Use `fx s "topic"` for targeted discovery
- Drill down with `fx metrics show "specific-function"`

### 2. Quality-Focused Workflows
- Always collect metrics before major changes
- Use PR-based tracking for change impact
- Focus on violations first, then broader patterns

### 3. Efficient Integration
- Use simplified `fx` commands for speed
- Leverage configuration files for consistency
- Implement quality gates in CI/CD pipelines

### 4. Data Processing
- Parse JSONL output line-by-line for large codebases
- Use hash fields for change detection
- Combine with other tools for comprehensive analysis

## Legacy Command Support

The following legacy commands are still supported but deprecated:

```bash
# Legacy (still works, but use new structure)
function-indexer collect-metrics --root ./src --pr 123
function-indexer show-metrics "src/file.ts:function"
function-indexer analyze-trends
function-indexer pr-metrics 123

# New preferred structure
fx metrics collect --root ./src --pr 123
fx metrics show "src/file.ts:function"
fx metrics trends
fx metrics pr 123
```

## Summary

Function Indexer provides AI assistants with comprehensive tools for code quality management:

1. **Discovery**: Find and understand functions across large codebases
2. **Analysis**: Track quality metrics and identify improvement opportunities
3. **Monitoring**: Observe quality trends over time and across development phases
4. **Integration**: Seamlessly incorporate into existing development workflows

The tool is designed to work immediately with zero configuration while providing extensive customization options for advanced use cases.