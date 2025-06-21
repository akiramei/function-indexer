# Function Indexer

> 🚀 A modern TypeScript function analyzer that helps you understand and maintain your codebase

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌐 Documentation Languages

- **English** (you are here) | [**日本語**](docs/README-ja.md)

## ✨ What is Function Indexer?

Function Indexer scans your TypeScript/TSX codebase and creates a comprehensive index of all functions, methods, and arrow functions. It's designed to help developers and AI assistants understand code structure, track complexity, and maintain code quality.

### Key Features

- 🔍 **Smart Indexing** - Automatically finds and catalogs all functions in your codebase
- 📊 **Code Metrics** - Tracks complexity, lines of code, and other quality indicators
- 🎯 **Zero Config** - Works out of the box with sensible defaults
- 🔄 **Incremental Updates** - Efficiently updates only changed functions
- 🤖 **AI-Ready** - Outputs structured data perfect for AI development workflows

## 🚀 Quick Start

### Installation

```bash
# Install from GitHub
npm install -g github:akiramei/function-indexer

# Or using the full URL
npm install -g https://github.com/akiramei/function-indexer.git

# Or clone and link locally for development
git clone https://github.com/akiramei/function-indexer.git
cd function-indexer
npm install
npm link
```

### First Run

```bash
# Run in your project - that's it!
function-indexer
```

**🎯 New to Function Indexer?** Check our guides:
- 📚 **[Complete Tutorial](docs/TUTORIAL.md)** - Step-by-step guide with real examples
- ⚡ **[Quick Start Guide](docs/QUICK-START.md)** - Get running in 60 seconds
- 🔧 **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

**🇯🇵 日本語ドキュメント:**
- 📚 **[完全チュートリアル](docs/TUTORIAL-ja.md)** - 実例付きステップバイステップガイド
- ⚡ **[クイックスタート](docs/QUICK-START-ja.md)** - 60秒で開始
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
function-indexer

# Search for functions using natural language
function-indexer search "authentication"

# View code quality metrics
function-indexer metrics
```

### Working with Specific Directories

```bash
# Scan a specific directory
function-indexer -r ./src/services

# Scan multiple projects
function-indexer add frontend ./src/frontend
function-indexer add backend ./src/backend
function-indexer update  # Update all projects
```

### CI/CD Integration

```bash
# In your CI pipeline  
function-indexer
function-indexer metrics

# Pre-commit hook (with Husky)
function-indexer && npm run quality:check
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

If you're using an older version with manual commands:

```bash
# Old way
function-indexer --root ./src --output index.jsonl --domain backend

# New way (automatic)
function-indexer
```

Your existing indexes will continue to work, and the new version maintains backward compatibility.

## 🚦 Roadmap

### ✅ Current Features (v1.0)
- Zero-config operation
- Smart defaults and auto-detection
- Basic search and metrics
- Incremental updates

### 🚧 Coming Soon (v1.1)
- Git diff integration
- Markdown/HTML reports
- CI/CD optimizations
- Team collaboration features

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
- 🔗 **[Integration Guide](docs/INTEGRATIONS.md)** - CI/CD, Git hooks, VS Code integration
- ⚙️ **Configuration Guide** - Customize Function Indexer for your needs
- 📊 **Metrics Guide** - Understanding code quality metrics

### 🇯🇵 日本語ドキュメント
#### はじめに
- 📚 **[完全チュートリアル](docs/TUTORIAL-ja.md)** - Function Indexerをステップバイステップで学習
- ⚡ **[クイックスタートガイド](docs/QUICK-START-ja.md)** - プロジェクト固有のセットアップガイド
- 🔧 **[トラブルシューティング](docs/TROUBLESHOOTING-ja.md)** - よくある問題と解決方法

#### 高度な使用法
- 🔗 **[統合ガイド](docs/INTEGRATIONS-ja.md)** - CI/CD、Gitフック、VS Code統合
- ⚙️ **設定ガイド** - あなたのニーズに合わせてFunction Indexerをカスタマイズ
- 📊 **メトリクスガイド** - コード品質メトリクスの理解

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