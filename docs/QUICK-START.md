# ⚡ Quick Start Guide

## 🌐 Language Selection / 言語選択

**English** (you are here) | [日本語](QUICK-START-ja.md)

> Get Function Indexer running in your project in 60 seconds

## 🎯 Choose Your Project Type

<details>
<summary>🟦 <strong>TypeScript/Node.js Project</strong></summary>

### Installation
```bash
# Install from GitHub
npm install -g github:akiramei/function-indexer

# Then navigate to your project
cd your-typescript-project
function-indexer
```

### What You'll See
```
🚀 Welcome to Function Indexer!
✨ Detected typescript project at: /your/project
✅ Created configuration in .function-indexer/
📁 Scanning: src/
✅ Indexing completed!
📊 Functions found: 42
```

### Next Steps
```bash
# View code quality
function-indexer metrics

# Search for functions
function-indexer search "database"
```

### Common Use Cases
- **API Development**: Find route handlers and middleware
- **Library Creation**: Track exported functions and complexity
- **Refactoring**: Identify complex functions that need breaking down

</details>

<details>
<summary>⚛️ <strong>React Project</strong></summary>

### Installation
```bash
npm install -g github:akiramei/function-indexer
cd your-react-app
function-indexer
```

### What You'll Get
- ✅ React components (functional & class)
- ✅ Custom hooks (useState, useEffect, etc.)
- ✅ Utility functions
- ✅ Event handlers
- ✅ JSX/TSX support

### Quick Commands
```bash
# Find React components
function-indexer search "component"

# Find custom hooks
function-indexer search "hook use"

# Check component complexity
function-indexer metrics --details
```

### Example Output
```
🔍 Searching for: "component"

1. UserProfile (src/components/UserProfile.tsx:10)
   function UserProfile(props: UserProps): JSX.Element

2. LoginForm (src/components/auth/LoginForm.tsx:15)
   const LoginForm: React.FC<LoginProps> = ({ onSubmit })
```

</details>

<details>
<summary>🟨 <strong>JavaScript Project</strong></summary>

### Installation
```bash
npm install -g github:akiramei/function-indexer
cd your-js-project
function-indexer
```

### Setup for Pure JavaScript
```bash
# Function Indexer works with .js files too!
function-indexer
```

### Enhance with JSDoc
```javascript
/**
 * Authenticates a user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<User>} Authenticated user
 */
async function authenticateUser(email, password) {
  // Your code here
}
```

### Quick Commands
```bash
# Find all functions
function-indexer search "function"

# View complexity metrics
function-indexer metrics
```

</details>

<details>
<summary>🏗️ <strong>Monorepo/Multi-Package</strong></summary>

### Installation
```bash
npm install -g github:akiramei/function-indexer
cd your-monorepo
```

### Setup for Each Package
```bash
# Analyze each package separately
cd packages/frontend
function-indexer

cd ../backend  
function-indexer

cd ../shared
function-indexer
```

### Unified Analysis (Advanced)
```bash
# From monorepo root
function-indexer --root packages/frontend
function-indexer --root packages/backend

# Compare complexity across packages
function-indexer metrics --details
```

### Workspace Integration
```json
// package.json in monorepo root
{
  "scripts": {
    "analyze": "npm run analyze:frontend && npm run analyze:backend",
    "analyze:frontend": "cd packages/frontend && function-indexer",
    "analyze:backend": "cd packages/backend && function-indexer"
  }
}
```

</details>

<details>
<summary>⚡ <strong>Next.js Project</strong></summary>

### Installation
```bash
npm install -g github:akiramei/function-indexer
cd your-nextjs-app
function-indexer
```

### What Function Indexer Finds
- ✅ Page components (`pages/` or `app/`)
- ✅ API routes (`pages/api/` or `app/api/`)
- ✅ Server components
- ✅ Client components
- ✅ Custom hooks
- ✅ Utility functions

### Next.js Specific Commands
```bash
# Find API routes
function-indexer search "api route handler"

# Find page components
function-indexer search "page component"

# Check SSR/SSG functions
function-indexer search "getServerSideProps getStaticProps"
```

### Example Output
```
📊 Code Quality Metrics

API Routes Found: 8
Page Components: 12
Custom Hooks: 5
Utility Functions: 23

⚠️ Complex API routes:
  • pages/api/users/[id].ts:handler (complexity: 12)
```

</details>

<details>
<summary>🔧 <strong>Express.js API</strong></summary>

### Installation
```bash
npm install -g github:akiramei/function-indexer
cd your-express-api
function-indexer
```

### Express-Specific Analysis
Function Indexer excels at analyzing Express APIs:

```bash
# Find route handlers
function-indexer search "route handler"

# Find middleware functions  
function-indexer search "middleware"

# Check controller complexity
function-indexer search "controller"
```

### Sample Project Structure
```
src/
├── controllers/
├── middleware/
├── routes/
├── services/
└── utils/
```

### Quick Health Check
```bash
# Check API complexity
function-indexer metrics

# Find potential refactoring candidates
function-indexer metrics --details
```

</details>

<details>
<summary>📱 <strong>React Native Project</strong></summary>

### Installation
```bash
npm install -g github:akiramei/function-indexer
cd your-react-native-app
function-indexer
```

### React Native Features
- ✅ Screen components
- ✅ Custom hooks
- ✅ Navigation functions
- ✅ Platform-specific code
- ✅ Native module interfaces

### Quick Commands
```bash
# Find screen components
function-indexer search "screen component"

# Find navigation functions
function-indexer search "navigation"

# Check component complexity
function-indexer metrics
```

</details>

## 🔄 Universal Commands

Regardless of your project type, these commands work everywhere:

```bash
# Basic indexing
function-indexer

# Code quality overview
function-indexer metrics

# Search functions
function-indexer search "your query"

# Help
function-indexer --help
```

## 🎯 Project-Specific Tips

### Frontend Projects (React, Vue, Angular)
```bash
# Focus on component complexity
function-indexer search "component" | head -20

# Find event handlers
function-indexer search "onClick onSubmit onChange"
```

### Backend Projects (Node.js, Express)
```bash
# API health check
function-indexer search "route handler" 

# Middleware analysis
function-indexer search "middleware auth"
```

### Library Projects
```bash
# Public API overview
function-indexer search "export" --context "public"

# Complexity before publishing
function-indexer metrics --details
```

## ⚠️ Troubleshooting

<details>
<summary><strong>No functions found?</strong></summary>

**Possible causes:**
- No TypeScript/JavaScript files in expected locations
- Files are in non-standard directories

**Solutions:**
```bash
# Specify custom directory
function-indexer --root ./your-custom-src

# Check what Function Indexer detected
function-indexer --verbose
```

</details>

<details>
<summary><strong>Missing some files?</strong></summary>

**Check configuration:**
```bash
# View current config
cat .function-indexer/config.json

# Add more file patterns
# Edit config to include: ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"]
```

</details>

<details>
<summary><strong>Too many false positives?</strong></summary>

**Exclude unwanted directories:**
```json
{
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts", 
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**"
  ]
}
```

</details>

## 🎉 Success!

You're now ready to analyze your codebase! 

**Next steps:**
- 📖 Try the [Full Tutorial](TUTORIAL.md) for advanced features
- 🔧 Check [Configuration Guide](CONFIGURATION.md) for customization
- 🤝 Join our [Community](https://github.com/akiramei/function-indexer/discussions)

---

**⭐ Enjoying Function Indexer?** Star the project and share with your team!