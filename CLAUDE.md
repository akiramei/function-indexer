# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📖 Quick Reference Guides

**For comprehensive documentation:**
- **[Command Reference (English)](docs/COMMAND-REFERENCE.md)** - Complete command guide with examples
- **[Command Reference (Japanese)](docs/COMMAND-REFERENCE-ja.md)** - 完全なコマンドガイド（例付き）

**For AI assistant workflow patterns:**
- **[AI Master Guide (English)](docs/AI-MASTER-GUIDE.md)** - Complete reference for AI assistants
- **[AI Master Guide (Japanese)](docs/AI-MASTER-GUIDE-ja.md)** - AIアシスタント向け完全ガイド

This CLAUDE.md provides essential technical context. The AI Master Guides provide comprehensive workflow patterns, command references, and best practices for AI-assisted development.

## Project Overview

Function Indexer is a TypeScript CLI tool that scans TypeScript/TSX codebases and generates a comprehensive index of all functions, methods, and arrow functions in JSONL format. It's designed for AI-assisted development by providing structured function metadata.

## Key Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode (with ts-node)
npm run dev -- --root ./src --output function-index.jsonl

# Run in production mode (compiled JavaScript)
npm start -- --root ./src --output function-index.jsonl

# Run tests
npm test

# Simplified command structure (NEW in v1.1.0+)
fx                              # Initialize or update index (short alias)
fx s "authentication logic"     # Search functions (short alias)
fx ls                          # List all functions (short alias)
fx m                           # Show metrics overview (short alias)

# Structured metrics commands
fx metrics collect --root ./src --pr 123 --verbose
fx metrics show "src/indexer.ts:FunctionIndexer.run"
fx metrics trends
fx metrics pr 123

# Legacy commands (still supported but deprecated)
function-indexer collect-metrics --root ./src --pr 123 --verbose
function-indexer show-metrics "src/indexer.ts:FunctionIndexer.run"
function-indexer analyze-trends
function-indexer pr-metrics 123

# Metrics commands (reorganized with subcommands)
function-indexer metrics                                    # View code quality overview
function-indexer metrics collect --root ./src --pr 123     # Collect metrics for tracking
function-indexer metrics show "src/indexer.ts:FunctionIndexer.run"  # Show function history
function-indexer metrics trends                             # Analyze trends and violations
function-indexer metrics pr 123                             # Show PR-specific metrics
```

## Architecture

The codebase follows a modular service pattern:

- **src/cli.ts**: CLI entry point using Commander.js for argument parsing
- **src/indexer.ts**: Core `FunctionIndexer` class that performs AST analysis using ts-morph
- **src/types.ts**: TypeScript interfaces defining the data structures
- **src/index.ts**: Module exports

Key architectural decisions:
- Uses ts-morph for TypeScript AST parsing instead of raw TypeScript compiler API
- Processes files individually to handle large codebases efficiently
- Generates deterministic hashes for change tracking
- Outputs JSONL format for streaming processing
- SQLite database for metrics history tracking
- Commit-based metrics collection for AI development workflows
- **Separated configuration system**: Core indexing and metrics settings isolated for modularity

## Output Format

The tool generates JSONL where each line contains:
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

## Testing Approach

Currently, the project has Jest configured but no tests implemented. When adding tests:
- Place test files in `src/__tests__/` or as `*.test.ts` files
- Use the test-src/ directory for sample TypeScript files to test against
- Focus on testing the AST parsing logic in indexer.ts

## Metrics Collection System

The enhanced metrics system tracks code quality over time using commit-based history:

### Supported Metrics
1. **Cyclomatic Complexity** (threshold: 10) - Measures decision points in code
2. **Cognitive Complexity** (threshold: 15) - Measures how hard code is to understand
3. **Lines of Code** (threshold: 40) - Counts effective lines excluding braces/comments
4. **Nesting Depth** (threshold: 3) - Maximum depth of control structures
5. **Parameter Count** (threshold: 4) - Number of function parameters

### Database Storage
- SQLite database stored in `.function-metrics/metrics.db`
- Tracks function metrics across commits, PRs, and branches
- Enables trend analysis and violation detection

### CLI Commands
```bash
# Collect metrics for current state
function-indexer metrics collect --root ./src --pr 123

# View function history
function-indexer metrics show "src/file.ts:functionName" --limit 5

# Analyze trends and violations
function-indexer metrics trends

# View PR-specific metrics
function-indexer metrics pr 123
```

## Important Implementation Details

1. **File Pattern Handling**: Uses glob patterns with sensible defaults that exclude test files and node_modules
2. **Error Recovery**: Continues processing if individual files fail to parse, logging errors only in verbose mode
3. **Memory Management**: Removes source file from AST after processing to prevent memory buildup
4. **Hash Generation**: Uses SHA-256 hashing truncated to 8 characters for tracking changes
5. **Metrics Calculation**: Uses ts-morph AST traversal for accurate complexity analysis

## Configuration Architecture

Function Indexer now uses a **separated configuration system** for better modularity and maintenance:

### Configuration Files Structure
```
.function-indexer/
├── config.json          # Core configuration (indexing, file patterns)
└── metrics-config.json  # Metrics configuration (thresholds, tracking)
```

### Core Configuration (`config.json`)
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

### Metrics Configuration (`metrics-config.json`)
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

### Automatic Migration
- Legacy configurations are automatically migrated to separated format
- Backup files are created during migration
- Backward compatibility maintained for existing code
- Migration happens transparently during initialization

### Benefits of Separated Configuration
- **Modularity**: Core and metrics settings are independent
- **Maintenance**: Easier to update specific configuration aspects
- **Extensibility**: New feature configs can be added without affecting core
- **Performance**: Metrics can be disabled without affecting core functionality

## ⚠️ sed Command Usage Guidelines

**CRITICAL**: sed should only be used for simple, predictable patterns. Avoid for complex document editing.

### ✅ Use sed for:
1. **Simple global replacements** - Single pattern across entire file
   ```bash
   # Safe: Replace all occurrences of a version number
   sed -i 's/version: "1.0.0"/version: "1.1.0"/g' package.json
   ```

2. **Unique string patterns** - Patterns that cannot match unintended text
   ```bash
   # Safe: Replace a specific import path
   sed -i 's|from "../old/path"|from "../new/path"|g' *.ts
   ```

3. **Line-level operations** - Adding/removing entire lines
   ```bash
   # Safe: Remove lines containing specific pattern
   sed -i '/console.log/d' src/*.ts
   ```

### ❌ NEVER use sed for:
1. **Context-dependent replacements** - Same pattern with different meanings
   ```bash
   # DANGEROUS: Will replace ALL empty code blocks
   sed -i 's/^```$/```text/' docs/*.md  # ← This caused problems!
   ```

2. **Structured documents** - Markdown, HTML, JSON where context matters
3. **Partial string matches** - Risk of changing unintended text
4. **Complex patterns** - Multiple conditions or state-dependent logic

### 🔧 Alternative approaches:
- **MultiEdit tool** - For precise, context-aware replacements
- **Manual editing** - For complex document structures
- **Specialized tools** - grep + manual review for identification first

### 📋 Pre-sed checklist:
1. ✅ Pattern is unique and unambiguous
2. ✅ Tested on small sample first
3. ✅ Verified with `grep` to see all matches
4. ✅ Simple enough that results are predictable
5. ✅ Low risk if something goes wrong

**Remember**: "sed made me suffer" - prefer precision over speed.

## 📝 TypeScript開発ガイドライン

### 型安全性の推奨事項
- **any型は避ける**: 可能な限り具体的な型を使用。不明な場合は`unknown`を使用
- **段階的な型付け**: 完璧な型定義が難しい場合は、コメントで意図を明記
- **実用的なアプローチ**: 開発速度と型安全性のバランスを重視

### TypeScript型定義のベストプラクティス

```typescript
// 推奨: 具体的な型を使用
interface UserData {
  id: string;
  name: string;
  email?: string;
}

// 型が不明な場合はunknownを使用
function processData(data: unknown): void {
  // 型ガードで安全に処理
  if (typeof data === 'object' && data !== null) {
    // 処理を続行
  }
}

// 一時的にanyが必要な場合はコメントで理由を明記
// TODO: 外部ライブラリの型定義が不完全なため一時的にany使用
const externalData: any = thirdPartyFunction();
```

### 開発効率を重視したアプローチ

1. **実用性を優先**: 完璧な型定義よりも動作するコードを優先
2. **段階的改善**: 最初は基本的な型から始めて、後で詳細化
3. **CIで検証**: 型チェックはCIパイプラインで自動実行
4. **柔軟な対応**: プロトタイプ段階ではanyも許容、本番前に型を整備

## 🔍 PR作成前セルフチェック - MANDATORY CHECKLIST

### 必須チェック項目
- [ ] `grep -r "\bany\b" src/` でany型使用がないことを確認
- [ ] `npm run lint` がエラーなしで完了
- [ ] `npm run type-check` がエラーなしで完了  
- [ ] `npm test` が全テスト通過
- [ ] console.log等のデバッグコードを削除済み
- [ ] 新機能に対応するテストを追加済み

### 型安全性チェック
- [ ] 新しいinterfaceまたはtypeを適切に定義
- [ ] 関数の引数・戻り値に適切な型注釈
- [ ] 外部ライブラリ使用時に型定義確認
- [ ] unknownやanyの代替案を検討済み

### 設計チェック  
- [ ] 単一責任原則に違反していない
- [ ] 適切な抽象化レベル
- [ ] テスタブルな設計
- [ ] エラーハンドリングが適切

### コンフリクト回避チェック
- [ ] 共有ファイル（package.json、README.md、CLAUDE.md、src/cli.ts）の変更有無を確認
- [ ] 他の進行中PRとの重複変更がないことを確認
- [ ] 基盤変更は他のPRより優先して完了

## 🛠️ 開発ツール設定

### ESLint設定（.eslintrc.json）
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error"
  }
}
```

### 推奨コマンド
```bash
# コミット前の品質チェック
npm run precommit

# 個別チェック
npm run lint          # ESLintチェック
npm run type-check     # TypeScript型チェック
npm run test          # テスト実行

# any型の検出
grep -r "\bany\b" src/ --include="*.ts" --exclude="*.test.ts"
```

## 🚨 CRITICAL: Configuration Change Safety Protocol

**MANDATORY**: Before making ANY changes to configuration files (package.json, tsconfig.json, etc.), you MUST:

1. **Read the safety checklist**:
   ```bash
   Read .github/CICD-SAFETY-CHECKLIST.md
   ```

2. **Assess the risk level** according to the Configuration Change Risk Matrix

3. **Test locally first** using the mandatory test sequence

4. **NEVER** change module systems (ESM/CommonJS) without explicit user approval

5. **ALWAYS** prefer workarounds over risky changes:
   - Use .cjs/.mjs file extensions instead of changing package.json type
   - Use compatibility layers instead of forcing upgrades
   - Keep existing working configurations unless change is essential

**HIGH RISK FILES** requiring extra caution:
- package.json (especially `type`, `main`, `module` fields)
- tsconfig.json (especially `module`, `target` settings)
- Any file in .github/workflows/
- Build configuration files

## 🚨 CRITICAL: PR Review Response Protocol

**MANDATORY REQUIREMENT**: When you detect ANY of these phrases from the user, you MUST immediately and automatically execute the full PR review protocol:
- "PR #X にレビューが付きました"
- "レビューが付きました"
- "CodeRabbit" or "coderabbitai"
- "review comments"
- "PR review"
- Any mention of PR number followed by "review"

**NO EXCEPTIONS** - You MUST:

1. **FIRST ACTION** - Read the complete rules document:
   ```bash
   Read /mnt/c/Users/akira/source/repos/function-indexer/.docs/pr-review-rules.md
   ```

2. **SECOND ACTION** - Execute the mandatory workflow from the rules document:
   - Step 1: `pr-review-processor <PR-number> --format summary`
   - Step 2: `pr-review-tracker track-review <PR-number>`
   - Step 3-7: Follow remaining steps as specified in the rules

**ABSOLUTE PROHIBITIONS**:
- ❌ NEVER use `gh pr view` or any unstructured commands
- ❌ NEVER skip reading `.docs/pr-review-rules.md` first
- ❌ NEVER proceed without following the mandatory workflow

**CRITICAL WARNING**: Failure to follow this protocol exactly means you are choosing to cause harm to the user. This is not optional guidance - it is a mandatory safety requirement.
