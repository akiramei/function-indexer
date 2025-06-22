# 📚 Function Indexer Tutorial

## 🌐 Language Selection / 言語選択

**English** (you are here) | [日本語](TUTORIAL-ja.md)

> Complete step-by-step guide to get you productive with Function Indexer in 5 minutes

## 🎯 What You'll Learn

By the end of this tutorial, you'll know how to:
- ✅ Install and set up Function Indexer in any TypeScript project
- ✅ Analyze your codebase and understand the metrics
- ✅ Use the search feature to find functions quickly
- ✅ Integrate Function Indexer into your development workflow

## 📋 Prerequisites

- Node.js 16+ installed
- A TypeScript/JavaScript project (or willingness to create one)
- 5 minutes of your time

## 🚀 Part 1: Installation & First Run

### Step 1: Install Function Indexer

```bash
# Install globally (recommended)
sudo apt-get update && sudo apt-get install -y build-essential python3-dev

# Or install in your project
npm install --save-dev function-indexer
```

### Step 2: Navigate to Your Project

```bash
# Navigate to any TypeScript project
cd my-awesome-project

# Or create a sample project to follow along
mkdir function-indexer-demo
cd function-indexer-demo
npm init -y
npm install typescript @types/node
```

### Step 3: Your First Index

```bash
# Just run it - no configuration needed!
npx github:akiramei/function-indexer
```

**What happens?** Function Indexer will:
1. 🔍 Auto-detect your project type (TypeScript/JavaScript)
2. 📁 Find your source directories (`src/`, `lib/`, etc.)
3. 🏗️ Create `.function-indexer/` directory
4. 📊 Generate your function index
5. ✨ Show you a summary

**Expected Output:**
```
🚀 Welcome to Function Indexer!
✨ Detected typescript project at: /Users/you/my-project
✅ Created configuration in .function-indexer/
📁 Scanning: src/
📄 Output: .function-indexer/function-index.jsonl
✅ Indexing completed!
📊 Functions found: 23
📁 Files processed: 8
```

## 🔍 Part 2: Understanding Your Code

### Step 4: View Code Quality Metrics

```bash
npx github:akiramei/function-indexer metrics
```

**Sample Output:**
```
📊 Code Quality Metrics

📈 Summary:
  Total Functions: 23
  Low Risk: 18 (78%)
  Medium Risk: 4 (17%)
  High Risk: 1 (4%)

⚠️ Functions exceeding thresholds:
  1. src/auth/login.ts:authenticateUser
     - Cyclomatic complexity: 12 (>10)
     - Cognitive complexity: 18 (>15)

💡 Suggestions:
  • Consider breaking down complex functions
  • Extract helper methods to reduce nesting
  • Add unit tests for complex logic
```

### Step 5: Search for Functions

```bash
# Find authentication-related functions
npx github:akiramei/function-indexer search "authentication"

# Find functions that handle user data
npx github:akiramei/function-indexer search "user profile"

# Search with context for better results
npx github:akiramei/function-indexer search "database query" --context "user management"
```

**Sample Output:**
```
🔍 Searching for: "authentication"

Found 3 matching functions:

1. authenticateUser (src/auth/login.ts:15)
   async function authenticateUser(email: string, password: string): Promise<User>
   ⚠️ High complexity: 12

2. validateToken (src/auth/middleware.ts:8)
   function validateToken(token: string): boolean

3. generateAuthCode (src/auth/utils.ts:22)
   function generateAuthCode(): string
```

## 🔄 Part 3: Development Workflow Integration

### Step 6: Keep Your Index Updated

```bash
# Update after making changes
npx github:akiramei/function-indexer

# It's smart - only processes changed files!
```

### Step 7: Project-Specific Configuration (Optional)

Create `.function-indexer/config.json` to customize:

```json
{
  "include": ["**/*.ts", "**/*.tsx", "**/*.js"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "**/dist/**"],
  "metrics": {
    "thresholds": {
      "cyclomaticComplexity": 8,
      "cognitiveComplexity": 12,
      "linesOfCode": 40
    }
  }
}
```

## 🏗️ Part 4: Real-World Examples

### Example 1: Refactoring Complex Functions

**Before:** You have a complex function
```typescript
// src/payment/processor.ts
export async function processPayment(order: Order, card: Card, options: PaymentOptions) {
  // 50 lines of complex logic...
  // Cyclomatic complexity: 15
}
```

**Run Function Indexer:**
```bash
npx github:akiramei/function-indexer metrics --details
```

**Output shows:**
```
⚠️ High complexity function found:
   src/payment/processor.ts:processPayment
   - Cyclomatic complexity: 15 (>10)
   - Lines of code: 50 (>40)
   - Cognitive complexity: 20 (>15)
```

**After refactoring:** Break it down
```typescript
export async function processPayment(order: Order, card: Card, options: PaymentOptions) {
  validatePaymentRequest(order, card);
  const session = await createPaymentSession(order, options);
  return await executePayment(session, card);
}

function validatePaymentRequest(order: Order, card: Card) { /* ... */ }
async function createPaymentSession(order: Order, options: PaymentOptions) { /* ... */ }
async function executePayment(session: PaymentSession, card: Card) { /* ... */ }
```

**Re-run and see improvement:**
```bash
npx github:akiramei/function-indexer
npx github:akiramei/function-indexer metrics
```

### Example 2: Finding Dead Code

```bash
# Search for functions that might be unused
npx github:akiramei/function-indexer search "helper" --limit 20

# Look for functions that weren't updated recently
npx github:akiramei/function-indexer metrics | grep "Last updated"
```

### Example 3: Code Review Preparation

```bash
# Before submitting a PR, check code quality
npx github:akiramei/function-indexer metrics

# Search for functions you modified
npx github:akiramei/function-indexer search "user authentication login"

# Get a summary for your PR description
npx github:akiramei/function-indexer | grep "Functions found"
```

## 📁 Part 5: Project Type Examples

### React Project
```bash
cd my-react-app
npx github:akiramei/function-indexer  # Automatically detects TSX files

# Find React components
npx github:akiramei/function-indexer search "component"

# Find custom hooks
npx github:akiramei/function-indexer search "use"
```

### Node.js API Project
```bash
cd my-api-server
npx github:akiramei/function-indexer

# Find route handlers
npx github:akiramei/function-indexer search "route handler"

# Find middleware functions
npx github:akiramei/function-indexer search "middleware"
```

### Library/Package Project
```bash
cd my-library
npx github:akiramei/function-indexer

# Find exported functions
npx github:akiramei/function-indexer search "export" --context "public API"

# Check complexity before publishing
npx github:akiramei/function-indexer metrics
```

## 🔧 Part 6: Advanced Usage

### Integration with Git Hooks

Create `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Update function index before commit
npx github:akiramei/function-indexer

# Check for high complexity functions
if npx github:akiramei/function-indexer metrics | grep -q "High Risk"; then
  echo "⚠️ High complexity functions detected. Consider refactoring."
  npx github:akiramei/function-indexer metrics --details
fi
```

### CI/CD Integration

Add to your GitHub Actions:
```yaml
name: Code Quality Check
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Function Indexer
        run: sudo apt-get update && sudo apt-get install -y build-essential python3-dev
      
      - name: Analyze Code Quality
        run: |
          npx github:akiramei/function-indexer
          npx github:akiramei/function-indexer metrics
          
      - name: Check for High Complexity
        run: |
          if npx github:akiramei/function-indexer metrics | grep -q "High Risk"; then
            echo "::warning::High complexity functions detected"
            npx github:akiramei/function-indexer metrics --details
          fi
```

## 🎉 Congratulations!

You've now mastered Function Indexer! You can:

✅ **Automatically analyze** any TypeScript/JavaScript project  
✅ **Track code quality** with meaningful metrics  
✅ **Search functions** using natural language  
✅ **Integrate** with your development workflow  
✅ **Monitor complexity** and maintain code quality  

## 🆘 Need Help?

- 📖 Check our [Troubleshooting Guide](TROUBLESHOOTING.md)
- 🐛 Report issues on [GitHub](https://github.com/akiramei/function-indexer/issues)
- 💬 Join discussions in [GitHub Discussions](https://github.com/akiramei/function-indexer/discussions)

## 🎯 What's Next?

- Try the [Advanced Configuration Guide](ADVANCED.md)
- Explore [CI/CD Integration Examples](CI-CD.md)
- Learn about [Custom Metrics](METRICS.md)

---

**⭐ Did this tutorial help you?** Star the project on GitHub and share it with your team!