# 🚀 Getting Started with Function Indexer

## 🌐 Language Selection / 言語選択

**English** (you are here) | [日本語](GETTING-STARTED-ja.md)

> **New to Function Indexer?** This comprehensive guide will get you from zero to productive in minutes.

## 📖 What You'll Learn

1. [**Quick Installation**](#-quick-installation) - Get running in 60 seconds
2. [**First Run Experience**](#-first-run-walkthrough) - What to expect when you start
3. [**Essential Commands**](#-essential-commands) - The 5 commands you need to know
4. [**Next Steps**](#-what-to-do-next) - Productive workflows and best practices
5. [**Troubleshooting**](#-common-issues) - Quick fixes for common problems

---

## ⚡ Quick Installation

### Prerequisites
```bash
# Linux/WSL users only (skip if you're on macOS/Windows)
sudo apt update && sudo apt install build-essential python3
```

### One-Command Start
```bash
# Navigate to your TypeScript/JavaScript project
cd your-project

# Run Function Indexer (no installation needed!)
npx github:akiramei/function-indexer
```

**That's it!** Function Indexer will auto-detect your project and create an index of all your functions.

---

## 🎯 First Run Walkthrough

When you run Function Indexer for the first time, here's what happens:

### 1. Project Detection
```
🚀 Welcome to Function Indexer!
✨ Detected typescript project at: /your/project
📁 Found source directories: src, lib
🎯 Suggested scan root: src
```

### 2. Automatic Configuration
```
✅ Created configuration in .function-indexer/
📁 Scanning: ./src
📄 Output: function-index.jsonl
```

### 3. Function Analysis
```
✅ Indexing completed!
📁 Files processed: 45
🔧 Functions found: 127
⏱️  Execution time: 1250ms
```

### 4. Next Steps Guidance
You'll see specific suggestions for what to do next - **this is your roadmap to getting value from Function Indexer!**

---

## 🔧 Essential Commands

These 5 commands cover 90% of your Function Indexer usage:

### 1. **Index/Update Your Code** (`fx`)
```bash
# Initialize or update your function index
fx
# Or the full command:
function-indexer
```
**When to use:** First time setup, after major code changes, daily updates

### 2. **Search for Functions** (`fx s`)
```bash
# Find functions using natural language
fx search "authentication"
fx s "user login"          # Short alias
fx s "database connection" # Works with concepts, not just names
```
**When to use:** Finding specific functionality, code exploration, onboarding

### 3. **View Code Quality** (`fx m`)
```bash
# Quick metrics overview
fx metrics
fx m              # Short alias

# Detailed function-level metrics
fx m --details
```
**When to use:** Code reviews, refactoring planning, quality checks

### 4. **List All Functions** (`fx ls`)
```bash
# See all functions in your codebase
fx list
fx ls             # Short alias

# Filter by file or pattern
fx ls --file "auth"
```
**When to use:** Getting project overview, finding unused code

### 5. **Track Changes** (`fx d`)
```bash
# Compare functions between branches
fx diff main feature-branch
fx d main HEAD    # Short alias

# See what changed since last commit
fx d HEAD~1 HEAD
```
**When to use:** Code reviews, understanding impact of changes

---

## 🎯 What To Do Next

After your first successful run, try these workflows in order:

### 🔍 **Immediate: Explore Your Codebase**
```bash
# Get familiar with your project structure
fx ls

# Search for your main functionality
fx s "main function"
fx s "api routes"
fx s "database"
```

### 📊 **Day 1: Check Code Quality**
```bash
# See overall code health
fx m

# Find complex functions that might need refactoring
fx m --details | grep "High complexity"

# Track complexity over time
fx metrics collect
```

### 🔄 **Week 1: Integrate into Workflow**
```bash
# Before code reviews
fx d main your-feature-branch

# Regular quality checks
fx m

# Update index after changes
fx
```

### 🤝 **Week 2: Team Integration**
```bash
# Generate reports for the team
fx report --format markdown

# Set up CI/CD integration
fx ci --format github

# Share quality metrics
fx metrics trends
```

---

## 🎨 Project-Specific Tips

### **React/Frontend Projects**
```bash
# Find React components
fx s "component"

# Look for hooks
fx s "useState useEffect"

# Check component complexity
fx m --details
```

### **Node.js/Backend Projects**
```bash
# Find API routes
fx s "route handler"

# Look for middleware
fx s "middleware auth"

# Database functions
fx s "database query"
```

### **Library/Package Projects**
```bash
# Check exported functions
fx s "export"

# Verify API complexity before publishing
fx m --details

# Compare versions
fx d v1.0.0 main
```

---

## ⚠️ Common Issues

<details>
<summary><strong>🔍 "No functions found" or very few results</strong></summary>

**Likely causes:**
- Function Indexer is scanning the wrong directory
- Your source files are in a non-standard location

**Quick fixes:**
```bash
# Check what was detected
fx --verbose

# Specify custom source directory
fx --root ./your-src-directory

# Check configuration
cat .function-indexer/config.json
```

**Edit config if needed:**
```json
{
  "root": "./src",
  "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
}
```
</details>

<details>
<summary><strong>📁 "Project not initialized" error</strong></summary>

**What happened:** You tried to use search/metrics without running the basic `fx` command first.

**Fix:**
```bash
# Run basic indexing first
fx

# Then try your search/metrics command again
fx s "your query"
```
</details>

<details>
<summary><strong>🐛 Build tool errors (Linux/WSL)</strong></summary>

**What happened:** Native dependencies need build tools.

**Fix:**
```bash
# Install required build tools
sudo apt update && sudo apt install build-essential python3

# Try running Function Indexer again
fx
```
</details>

<details>
<summary><strong>🔄 Slow performance on large codebases</strong></summary>

**Solutions:**
```bash
# Exclude unnecessary directories
fx --root ./src  # Instead of scanning everything

# Edit .function-indexer/config.json to exclude more:
{
  "exclude": [
    "**/node_modules/**",
    "**/dist/**", 
    "**/build/**",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```
</details>

---

## 🎉 Success Checklist

You're successfully using Function Indexer when you can:

- [ ] **Initialize your project** - `fx` completes without errors
- [ ] **Search effectively** - `fx s "authentication"` finds relevant functions  
- [ ] **Understand code quality** - `fx m` shows meaningful metrics
- [ ] **Track changes** - `fx d main feature` shows function differences
- [ ] **Integrate into workflow** - You run `fx` regularly and it saves you time

## 📚 What's Next?

Once you're comfortable with the basics:

- **📖 [Complete Tutorial](TUTORIAL.md)** - Deep dive with real examples
- **🔧 [Configuration Guide](CONFIGURATION.md)** - Customize for your needs  
- **🔗 [Integration Guide](INTEGRATIONS.md)** - CI/CD, Git hooks, VS Code
- **👥 [Team Features](TEAM-FEATURES.md)** - Advanced collaboration features
- **🤖 [AI Assistant Guide](AI-GUIDE.md)** - Use with AI tools effectively

## 🤝 Need Help?

- **📋 [Full Command Reference](COMMAND-REFERENCE.md)** - Complete command documentation
- **🛠️ [Troubleshooting Guide](TROUBLESHOOTING.md)** - Detailed problem solving
- **💬 [GitHub Discussions](https://github.com/akiramei/function-indexer/discussions)** - Community support
- **🐛 [Report Issues](https://github.com/akiramei/function-indexer/issues)** - Bug reports and feature requests

---

**🌟 Enjoying Function Indexer?** Star the project and share it with your team!