# 🚀 Getting Started with Function Indexer

## 🌐 Language Selection / 言語選択

**English** (you are here) | [日本語](GETTING-STARTED-ja.md)

> **Complete guide from zero to productive** - Get running in 60 seconds, master the essentials in 5 minutes

## 📖 What You'll Learn

This progressive guide covers everything you need:

1. [**⚡ Quick Start (60 seconds)**](#-quick-start-60-seconds) - Get running immediately
2. [**📊 Understanding Your Results**](#-understanding-your-results) - Make sense of the output
3. [**🔧 Essential Commands**](#-essential-commands) - The core commands you need
4. [**🎯 Deep Dive (30 minutes)**](#-deep-dive-project-integration) - Advanced usage and integration
5. [**🚀 Mastery & Best Practices**](#-mastery--best-practices) - Professional workflows

---

## ⚡ Quick Start (60 seconds)

### Prerequisites
```bash
# Linux/WSL users only (skip if you're on macOS/Windows)
sudo apt update && sudo apt install build-essential python3
```

### Choose Your Project Type

<details>
<summary>🟦 <strong>TypeScript/Node.js Project</strong></summary>

#### Installation & First Run
```bash
# Navigate to your project and run directly
cd your-typescript-project
npx github:akiramei/function-indexer
```

#### What You'll See
```
🚀 Welcome to Function Indexer!
✨ Detected typescript project at: /your/project
✅ Created configuration in .function-indexer/
📁 Scanning: src/
✅ Indexing completed!

📊 Results:
   • Functions found: 47
   • Files processed: 12
   • Output: function-index.jsonl

🎯 Quick commands to try next:
   fx s "auth"        # Search for authentication functions
   fx m               # View code quality metrics
   fx ls --exported   # List exported functions only
```

#### Next Steps
```bash
# Search your functions
fx s "authentication"

# Check code quality
fx m

# See all available commands
fx --help
```

</details>

<details>
<summary>🟧 <strong>React Project</strong></summary>

#### Installation & First Run
```bash
# Prerequisites (Linux/WSL users)
sudo apt update && sudo apt install build-essential python3

# Navigate to your React project
cd your-react-app
npx github:akiramei/function-indexer --root ./src
```

#### What You'll See
```
🚀 Welcome to Function Indexer!
✨ Detected React project at: /your/react-app
📁 Scanning: src/
✅ Found components, hooks, and utilities

📊 Results:
   • Functions found: 23 (12 components, 8 hooks, 3 utilities)
   • Files processed: 8
   • Output: function-index.jsonl

🎯 Try these React-specific searches:
   fx s "component"   # Find React components
   fx s "hook"        # Find custom hooks
   fx s "handler"     # Find event handlers
```

#### Next Steps
```bash
# Find React patterns
fx s "useState"
fx s "useEffect"
fx s "onClick"

# Check component complexity
fx m
```

</details>

<details>
<summary>🟪 <strong>Large Codebase/Monorepo</strong></summary>

#### Installation & First Run
```bash
# Prerequisites (Linux/WSL users)
sudo apt update && sudo apt install build-essential python3

# For large codebases, specify root directory
cd your-monorepo
npx github:akiramei/function-indexer --root ./packages/core --output core-functions.jsonl
```

#### What You'll See
```
🚀 Welcome to Function Indexer!
📁 Scanning: packages/core/
⏳ Processing large codebase... (this may take a moment)
✅ Indexing completed!

📊 Results:
   • Functions found: 234
   • Files processed: 67
   • Output: core-functions.jsonl

💡 Pro tip: Use domain classification for better organization
```

#### Next Steps
```bash
# Scan different parts with domains
npx github:akiramei/function-indexer --root ./packages/api --domain backend
npx github:akiramei/function-indexer --root ./packages/ui --domain frontend

# Set up metrics tracking
fx metrics collect --root ./packages/core
```

</details>

<details>
<summary>🔄 <strong>Existing Project with Legacy Code</strong></summary>

#### Installation & First Run
```bash
# Prerequisites (Linux/WSL users)
sudo apt update && sudo apt install build-essential python3

# Navigate to your project
cd your-existing-project
npx github:akiramei/function-indexer --verbose
```

#### What You'll See
```
🚀 Welcome to Function Indexer!
📁 Scanning: ./
⚠️  Found mixed file types, focusing on TypeScript/JavaScript
✅ Indexing completed with some warnings

📊 Results:
   • Functions found: 156
   • Files processed: 43
   • Warnings: 3 (see --verbose output)
   • Output: function-index.jsonl

🔍 Quality overview:
   ⚠️  12 functions exceed complexity threshold
   ⚠️  5 functions are very long (>50 lines)
```

#### Next Steps
```bash
# Check code quality issues
fx metrics trends

# Focus on problem areas
fx s "TODO" --context "fix"
fx s "legacy" --context "refactor"
```

</details>

---

## 📊 Understanding Your Results

### Output File Structure
Function Indexer creates a `function-index.jsonl` file where each line represents one function:

```json
{
  "file": "src/auth/login.ts",
  "identifier": "validateUser",
  "signature": "async validateUser(email: string, password: string): Promise<User>",
  "startLine": 15,
  "endLine": 28,
  "exported": true,
  "async": true,
  "metrics": {
    "linesOfCode": 12,
    "cyclomaticComplexity": 3,
    "cognitiveComplexity": 4,
    "nestingDepth": 2,
    "parameterCount": 2,
    "hasReturnType": true
  }
}
```

### Key Fields Explained
- **`file`**: Location of the function
- **`identifier`**: Function name (including class context if method)
- **`signature`**: Complete function signature
- **`metrics`**: Code quality measurements
- **`exported`**: Whether function is exported (public API)
- **`async`**: Whether function is asynchronous

### Quality Metrics Guide
- **Cyclomatic Complexity** (threshold: 10): Decision points in code
- **Cognitive Complexity** (threshold: 15): How hard code is to understand
- **Lines of Code** (threshold: 50): Actual code lines (excluding braces/comments)
- **Nesting Depth** (threshold: 4): Maximum depth of if/for/while statements
- **Parameter Count** (threshold: 4): Number of function parameters

---

## 🔧 Essential Commands

### 1. Basic Scanning
```bash
# Scan current directory
fx

# Scan specific directory with custom output
fx --root ./src --output my-functions.jsonl

# Scan with domain classification
fx --root ./backend --domain api
```

### 2. Search Functions
```bash
# Natural language search
fx s "authentication"
fx s "user validation"
fx s "error handling"

# Pattern-based search
fx search --pattern "handle*Error"
fx search --pattern "validate*" --async-only

# Context-aware search
fx s "login" --context "auth"
```

### 3. Quality Analysis
```bash
# View quality overview
fx m
fx metrics

# Collect metrics for tracking
fx metrics collect --root ./src

# View trends and violations
fx metrics trends

# Check specific function history
fx metrics show "src/auth.ts:validateUser"
```

### 4. List and Filter
```bash
# List all functions
fx ls

# Filter by criteria
fx ls --exported-only
fx ls --complexity ">10"
fx ls --file "src/auth.ts"
fx ls --async-only
```

---

## 🎯 Deep Dive: Project Integration

### Step 1: Configuration Setup

Function Indexer automatically creates configuration files, but you can customize them:

#### Core Configuration (`.function-indexer/config.json`)
```json
{
  "version": "1.1.0",
  "root": "./src",
  "output": "function-index.jsonl",
  "domain": "main",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"]
}
```

#### Metrics Configuration (`.function-indexer/metrics-config.json`)
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
    "maxHistoryDays": 365
  }
}
```

### Step 2: Development Workflow Integration

#### Pre-commit Quality Gates
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Running Function Indexer quality check..."
fx metrics collect --root ./src

# Check for violations
fx metrics trends --format json > /tmp/violations.json
if [ -s /tmp/violations.json ]; then
    echo "❌ Code quality violations detected!"
    fx metrics trends
    exit 1
fi

echo "✅ Quality check passed"
```

#### Package.json Scripts
```json
{
  "scripts": {
    "analyze": "fx --root ./src",
    "quality": "fx metrics",
    "quality:collect": "fx metrics collect --root ./src",
    "quality:trends": "fx metrics trends",
    "search": "fx s"
  }
}
```

### Step 3: Team Collaboration

#### PR Analysis Workflow
```bash
# Before starting work
fx metrics collect --root ./src --pr 123

# After completing changes
fx metrics collect --root ./src --pr 123

# Review changes
fx metrics pr 123
```

#### Code Review Helpers
```bash
# Find complex functions for review priority
fx ls --complexity ">10" --lines ">30"

# Search for specific patterns that need attention
fx s "TODO" --context "refactor"
fx s "FIXME" --context "bug"
```

### Step 4: CI/CD Integration

#### GitHub Actions Example
```yaml
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
        run: |
          fx metrics trends --format json > violations.json
          if [ -s violations.json ]; then
            echo "Quality violations detected:"
            fx metrics trends
            exit 1
          fi
```

---

## 🚀 Mastery & Best Practices

### Progressive Analysis Strategy

#### 1. Initial Assessment (5 minutes)
```bash
# Get the big picture
fx metrics

# Identify hotspots
fx metrics trends

# Search for common issues
fx s "any" --context "type"
fx s "console.log"
```

#### 2. Focused Investigation (15 minutes)
```bash
# Analyze specific violations
fx metrics show "src/complex-file.ts:complexFunction"

# Search for related patterns
fx s "authentication" --context "security"
fx s "error" --context "handling"

# List high-risk functions
fx ls --complexity ">15" --lines ">40"
```

#### 3. Systematic Improvement (ongoing)
```bash
# Set up regular tracking
fx metrics collect --root ./src

# Monitor trends
fx metrics trends --since "1 week ago"

# Review PR impact
fx metrics pr <pr-number>
```

### Quality-Focused Workflows

#### Daily Code Quality Check
```bash
#!/bin/bash
# daily-quality.sh

echo "📊 Daily Code Quality Report"
echo "=========================="

# Overall metrics
fx metrics

echo ""
echo "🎯 Recent Trends:"
fx metrics trends --since "1 day ago"

echo ""
echo "⚠️  Functions Needing Attention:"
fx ls --complexity ">10" --lines ">30" | head -10
```

#### Refactoring Workflow
```bash
# 1. Identify candidates
fx ls --complexity ">15" --exported-only

# 2. Analyze specific function
fx metrics show "src/target.ts:complexFunction"

# 3. Track improvement
fx metrics collect --root ./src --note "before refactor"
# ... make changes ...
fx metrics collect --root ./src --note "after refactor"
```

#### Code Review Preparation
```bash
# Generate review-focused analysis
echo "🔍 Functions changed in this PR:"
fx metrics pr $(git log --oneline -1 | cut -d' ' -f1)

echo ""
echo "⚠️  Complexity violations:"
fx metrics trends --pr-only

echo ""
echo "🎯 Search patterns to review:"
fx s "TODO" --context "review"
fx s "FIXME" --context "urgent"
```

### Advanced Search Techniques

#### Semantic Search Examples
```bash
# Architecture patterns
fx s "singleton" --context "pattern"
fx s "factory" --context "creation"
fx s "observer" --context "event"

# Security-focused searches
fx s "auth" --context "security"
fx s "validate" --context "input"
fx s "sanitize" --context "xss"

# Performance-related searches
fx s "cache" --context "performance"
fx s "async" --context "optimization"
fx s "batch" --context "processing"
```

#### Pattern-Based Discovery
```bash
# API patterns
fx search --pattern "*Handler" --exported-only
fx search --pattern "*Controller" --async-only
fx search --pattern "*Service" --complexity "<5"

# Utility patterns
fx search --pattern "is*" --lines "<10"
fx search --pattern "get*" --return-type-required
fx search --pattern "validate*" --parameter-count ">2"
```

### Integration with Development Tools

#### VS Code Integration
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Analyze Functions",
      "type": "shell",
      "command": "fx",
      "args": ["--root", "./src"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always"
      }
    },
    {
      "label": "Quality Check",
      "type": "shell",
      "command": "fx",
      "args": ["metrics", "trends"],
      "group": "test"
    }
  ]
}
```

#### ESLint Integration
```javascript
// Custom ESLint rule based on Function Indexer data
// .eslintrc.js
module.exports = {
  rules: {
    'max-complexity': ['error', { max: 10 }], // Align with Function Indexer thresholds
    'max-lines-per-function': ['error', { max: 50 }],
    'max-params': ['error', { max: 4 }]
  }
};
```

---

## 🔧 Common Issues & Solutions

### Installation Problems

#### Issue: "build-essential not found"
```bash
# Solution: Update package lists first
sudo apt update
sudo apt install build-essential python3-dev
```

#### Issue: "Permission denied" on global install
```bash
# Solution: Use npx instead of global install
npx github:akiramei/function-indexer

# Or fix npm permissions
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

### Parsing Issues

#### Issue: "Failed to parse TypeScript files"
```bash
# Solution 1: Check TypeScript compilation
npx tsc --noEmit

# Solution 2: Use verbose mode to see details
fx --verbose --root ./src

# Solution 3: Exclude problematic files
fx --root ./src --exclude "**/*.d.ts" --exclude "**/generated/**"
```

#### Issue: "No functions found"
```bash
# Solution: Check file patterns
fx --root ./src --include "**/*.js" --include "**/*.ts"

# Or verify directory structure
ls -la src/
```

### Performance Issues

#### Issue: "Scanning takes too long"
```bash
# Solution 1: Exclude unnecessary directories
fx --root ./src --exclude "**/node_modules/**" --exclude "**/dist/**"

# Solution 2: Process smaller chunks
fx --root ./src/core --output core.jsonl
fx --root ./src/utils --output utils.jsonl
```

#### Issue: "Out of memory on large codebases"
```bash
# Solution: Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" fx --root ./src
```

### Output Issues

#### Issue: "JSONL file is empty"
```bash
# Solution: Check for write permissions
ls -la function-index.jsonl

# Or specify different output location
fx --root ./src --output ./outputs/functions.jsonl
```

#### Issue: "Metrics database locked"
```bash
# Solution: Close other Function Indexer processes
pkill -f function-indexer

# Or reset metrics database
rm -rf .function-metrics/
fx metrics collect --root ./src
```

---

## 🎉 Next Steps

Congratulations! You're now ready to use Function Indexer effectively. Here's what to explore next:

### For Individual Developers
1. **Set up daily quality checks** using the provided scripts
2. **Integrate with your IDE** for seamless workflow
3. **Explore advanced search patterns** for your specific domain

### For Teams
1. **Configure CI/CD integration** for automatic quality gates
2. **Establish team quality thresholds** in metrics configuration
3. **Create shared search patterns** for common code reviews

### For AI-Assisted Development
1. **Use the JSONL output** with AI tools for code analysis
2. **Set up automated quality reports** for AI-driven insights
3. **Explore the AI Integration Guide** for advanced patterns

### Additional Resources
- [📖 AI Integration Guide](AI-INTEGRATION.md) - Comprehensive AI assistant reference
- [📚 Command Reference](COMMAND-REFERENCE.md) - Complete command documentation
- [🔧 Advanced Usage](ADVANCED-USAGE.md) - Enterprise patterns and CI/CD
- [❓ Troubleshooting](TROUBLESHOOTING.md) - Detailed problem-solving guide

---

**Happy coding!** 🎯

> 💡 **Pro Tip**: Start with `fx metrics` every morning to get a quality overview of your codebase, then use `fx s "<topic>"` to dive into specific areas you're working on.