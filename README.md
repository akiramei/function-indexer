# Function Indexer

> 🚀 A modern TypeScript function analyzer that helps you understand and maintain your codebase

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌐 Documentation Languages

- **English** (you are here) | [**日本語**](docs/README-ja.md)

## 📋 Table of Contents

- [What is Function Indexer?](#-what-is-function-indexer)
- [🤖 For AI Assistants](#-for-ai-assistants) - **[AI Guide](docs/AI-GUIDE.md)**
- [Quick Start](#-quick-start)
- [Common Usage Patterns](#-common-usage-patterns)
- [Output Format](#-output-format)
- [Documentation](#-complete-documentation)

## ✨ What is Function Indexer?

Function Indexer scans your TypeScript/TSX codebase and creates a comprehensive index of all functions, methods, and arrow functions. It's designed to help developers and AI assistants understand code structure, track complexity, and maintain code quality.

### 🤖 For AI Assistants
**Looking to integrate Function Indexer into your workflow?** Check out our **[AI Assistant Guide](docs/AI-GUIDE.md)** - optimized for zero-shot usage with complete command references, task templates, and integration examples.

### Key Features

- 🔍 **Smart Indexing** - Automatically finds and catalogs all functions in your codebase
- 📊 **Code Metrics** - Tracks complexity, lines of code, and other quality indicators
- 🎯 **Zero Config** - Works out of the box with sensible defaults
- 🔄 **Incremental Updates** - Efficiently updates only changed functions
- 🤖 **AI-Ready** - Structured JSONL output perfect for AI assistants and automation workflows

## 🚀 Quick Start

### Installation

```bash
# Prerequisites (Linux/WSL users only)
sudo apt update && sudo apt install build-essential python3

# Run directly with npx (recommended - no installation needed!)
npx github:akiramei/function-indexer

# Or install locally to project
npm install --save-dev github:akiramei/function-indexer
npx function-indexer

# For development
git clone https://github.com/akiramei/function-indexer.git
cd function-indexer
npm install
npm run build
```

### First Run

```bash
# Run in your project - that's it!
npx github:akiramei/function-indexer
```

**🎯 New to Function Indexer?** Check our guides:
- 📚 **[Complete Tutorial](docs/TUTORIAL.md)** - Step-by-step guide with real examples
- ⚡ **[Quick Start Guide](docs/QUICK-START.md)** - Get running in 60 seconds
- 📋 **[Command Reference](docs/COMMAND-REFERENCE.md)** - All commands with examples
- 🤖 **[AI Assistant Guide](docs/AI-GUIDE.md)** - Zero-shot usage for AI assistants
- 🔧 **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

**🇯🇵 日本語ドキュメント:**
- 📚 **[完全チュートリアル](docs/TUTORIAL-ja.md)** - 実例付きステップバイステップガイド
- ⚡ **[クイックスタート](docs/QUICK-START-ja.md)** - 60秒で開始
- 🤖 **[AIガイド](docs/AI-GUIDE-ja.md)** - AIアシスタント向けゼロショット利用ガイド
- 🔧 **[トラブルシューティング](docs/TROUBLESHOOTING-ja.md)** - よくある問題と解決方法

No configuration needed! Function Indexer will:
- Auto-detect your TypeScript/TSX files
- Create a `.function-indexer/` directory
- Generate an index of all your functions
- Show code quality metrics

## 📖 Common Usage Patterns

### Basic Commands

```bash
# Index your codebase (first time or update)
npx github:akiramei/function-indexer
# Or use the shorter 'fx' command:
fx

# Search for functions using natural language
fx search "authentication"
fx s "authentication"  # Short alias

# List all functions
fx list
fx ls  # Short alias

# View code quality metrics
fx metrics
fx m  # Short alias

# Collect detailed metrics
fx metrics collect --root ./src

# Compare functions between branches (NEW!)
fx diff main feature
fx d main feature  # Short alias

# Generate comprehensive reports (NEW!)
fx report --format markdown
fx r --format markdown  # Short alias
```

### Working with Specific Directories

```bash
# Scan a specific directory
fx -r ./src/services

# Or install locally and use shorter commands
npm install --save-dev github:akiramei/function-indexer
fx -r ./src/frontend
fx -r ./src/backend
fx update  # Update existing indexes
```

### CI/CD Integration

```bash
# Prerequisites for CI environments
sudo apt update && sudo apt install build-essential python3

# In your CI pipeline (NEW!)
fx ci --format github

# Compare branches for PR analysis  
fx diff origin/main HEAD

# Collect metrics for PR tracking
fx metrics collect --pr 123

# Pre-commit hook (with Husky)
fx metrics
```

📋 **[Full Integration Guide](docs/INTEGRATIONS.md)** - GitHub Actions, GitLab CI, pre-commit hooks, and more

## 📊 Output Format

Function Indexer generates a JSONL file where each line contains:

```json
{
  "file": "src/auth/login.ts",
  "identifier": "authenticateUser",
  "signature": "async function authenticateUser(email: string, password: string): Promise<User>",
  "startLine": 10,
  "endLine": 35,
  "hash_function": "a41f22bc",
  "hash_file": "dc093e7f",
  "exported": true,
  "async": true,
  "metrics": {
    "cyclomaticComplexity": 8,
    "cognitiveComplexity": 12,
    "linesOfCode": 25,
    "parameterCount": 2,
    "nestingDepth": 3,
    "hasReturnType": true
  },
  "domain": "main"
}
```

## 🎯 Metrics Explained

Function Indexer tracks several code quality metrics:

| Metric | Threshold | Description |
|--------|-----------|-------------|
| **Cyclomatic Complexity** | 10 | Number of decision points in a function |
| **Cognitive Complexity** | 15 | How hard the function is to understand |
| **Lines of Code** | 50 | Effective lines (excluding comments/blanks) |
| **Nesting Depth** | 4 | Maximum depth of nested structures |
| **Parameter Count** | 4 | Number of function parameters |

## 🛠️ Configuration (Optional)

While Function Indexer works without configuration, you can customize it:

`.function-indexer/config.json`:
```json
{
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/node_modules/**"],
  "metrics": {
    "thresholds": {
      "cyclomaticComplexity": 10,
      "cognitiveComplexity": 15,
      "linesOfCode": 50
    }
  }
}
```

## 🔄 Migration from Previous Versions

If you're using an older version with global installation:

```bash
# Old way (npm install -g)
npm uninstall -g function-indexer  # Remove old global installation

# New way (npx - no installation needed)
npx github:akiramei/function-indexer

# Manual options still work
npx github:akiramei/function-indexer --root ./src --output index.jsonl
```

Your existing indexes will continue to work, and the new version maintains backward compatibility.

## 🚦 Roadmap

### ✅ Current Features (v1.0)
- Zero-config operation
- Smart defaults and auto-detection
- Basic search and metrics
- Incremental updates

### 🎉 New Team Features (v1.1)
- **Git Diff Integration** - Compare functions between branches/commits
- **Report Generation** - Markdown/HTML reports with customizable templates
- **CI/CD Commands** - One-stop command for CI pipelines with PR comments
- **Workflow Examples** - GitHub Actions, GitLab CI, CircleCI, Jenkins
- **Metrics Tracking** - Track complexity changes across commits and PRs
- **Team Collaboration** - Share reports and enforce quality gates

### 🔮 Future Plans (v1.2+)
- Real-time file watching
- VSCode extension
- AI-powered insights
- Web dashboard

See our [detailed roadmap](ROADMAP.md) for more information.

## 📚 Documentation

### 🇺🇸 English Documentation
#### Getting Started
- 📚 **[Complete Tutorial](docs/TUTORIAL.md)** - Learn Function Indexer step-by-step
- ⚡ **[Quick Start Guide](docs/QUICK-START.md)** - Project-specific setup guides
- 🔧 **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

#### Advanced Usage  
- 👥 **[Team Features Guide](docs/TEAM-FEATURES.md)** - Git diff, reports, CI/CD integration (NEW!)
- 🔗 **[Integration Guide](docs/INTEGRATIONS.md)** - CI/CD, Git hooks, VS Code integration
- ⚙️ **Configuration Guide** - Customize Function Indexer for your needs
- 📊 **Metrics Guide** - Understanding code quality metrics

### 🇯🇵 日本語ドキュメント
#### はじめに
- 📚 **[完全チュートリアル](docs/TUTORIAL-ja.md)** - Function Indexerをステップバイステップで学習
- ⚡ **[クイックスタートガイド](docs/QUICK-START-ja.md)** - プロジェクト固有のセットアップガイド
- 🔧 **[トラブルシューティング](docs/TROUBLESHOOTING-ja.md)** - よくある問題と解決方法

#### 高度な使用法
- 👥 **[チーム機能ガイド](docs/TEAM-FEATURES-ja.md)** - Git diff、レポート、CI/CD統合 (新機能！)
- 🔗 **[統合ガイド](docs/INTEGRATIONS-ja.md)** - CI/CD、Gitフック、VS Code統合
- ⚙️ **設定ガイド** - あなたのニーズに合わせてFunction Indexerをカスタマイズ
- 📊 **メトリクスガイド** - コード品質メトリクスの理解

#### AI-Ready Templates
- 🔍 **[Function Search](docs/templates/function-search.md)** - Find functions quickly with AI-optimized search patterns
- 📊 **[Code Quality Check](docs/templates/code-quality-check.md)** - Automated quality analysis workflows
- 🔄 **[PR Review Automation](docs/templates/pr-review-automation.md)** - Enhance PR reviews with metrics
- 🏗️ **[Codebase Understanding](docs/templates/codebase-understanding.md)** - Quickly grasp project architecture

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repository
git clone https://github.com/akiramei/function-indexer.git

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

## 📄 License

MIT © [Akira Mei](https://github.com/akiramei)

## 🙏 Acknowledgments

Built with:
- [ts-morph](https://github.com/dsherret/ts-morph) - TypeScript AST manipulation
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal styling

---

<p align="center">
  Made with ❤️ for developers who care about code quality
</p>