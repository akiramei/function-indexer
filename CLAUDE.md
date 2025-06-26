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

## ⚠️ 絶対禁止事項 - MANDATORY RESTRICTIONS

### 🚨 TypeScript開発での禁止事項
- **any型の使用禁止**: `any`型は絶対に使用しない。`unknown`または適切な型定義を使用
- **型アサーション乱用禁止**: `as any`は絶対使用しない
- **暗黙的any禁止**: `noImplicitAny: true`設定必須
- **型安全性の妥協禁止**: 型エラーを隠蔽するための安易な回避は禁止

#### 正しいアプローチ
```typescript
// ❌ 絶対禁止
const data: any = someFunction();
const result = data.anything.goes; // 型安全性なし

// ✅ 正しい方法
interface ExpectedData {
  id: string;
  value: number;
}
const data: ExpectedData = someFunction();
const result = data.value; // 型安全
```

### 🚨 コード品質での禁止事項
- **console.log残留禁止**: デバッグ用console.logはコミット前に必ず削除
- **TODO/FIXMEの放置禁止**: 発見したら即座に対応またはissue化
- **テスト無しコミット禁止**: 新機能は必ずテスト追加
- **リンターエラー無視禁止**: ESLintエラーは必ず修正してからコミット

### 🚨 開発プロセスでの禁止事項
- **並列PR作業禁止**: 共有ファイル変更時は順次実行必須
- **大量コンフリクト作業禁止**: 3つ以上のPRで同じファイル変更は避ける
- **品質チェック無視禁止**: pre-commit hookやCIチェックをスキップしない
- **型チェック無視禁止**: `npm run type-check`エラーは必ず修正

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
