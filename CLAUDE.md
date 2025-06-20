# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Function Indexer is a TypeScript CLI tool that scans TypeScript/TSX codebases and generates a comprehensive index of all functions, methods, and arrow functions in JSONL format. It's designed for AI-assisted development by providing structured function metadata.

## Key Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode (with ts-node)
npm run dev -- --root ./src --output function-index.jsonl --domain backend

# Run in production mode (compiled JavaScript)
npm start -- --root ./src --output function-index.jsonl --domain backend

# Run tests
npm test

# Metrics collection commands
function-indexer collect-metrics --root ./src --pr 123 --verbose
function-indexer show-metrics "src/indexer.ts:FunctionIndexer.run"
function-indexer analyze-trends
function-indexer pr-metrics 123
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
  domain: string;        // User-specified domain
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
function-indexer collect-metrics --root ./src --pr 123

# View function history
function-indexer show-metrics "src/file.ts:functionName" --limit 5

# Analyze trends and violations
function-indexer analyze-trends

# View PR-specific metrics
function-indexer pr-metrics 123
```

## Important Implementation Details

1. **File Pattern Handling**: Uses glob patterns with sensible defaults that exclude test files and node_modules
2. **Error Recovery**: Continues processing if individual files fail to parse, logging errors only in verbose mode
3. **Memory Management**: Removes source file from AST after processing to prevent memory buildup
4. **Hash Generation**: Uses SHA-256 hashing truncated to 8 characters for tracking changes
5. **Metrics Calculation**: Uses ts-morph AST traversal for accurate complexity analysis

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
