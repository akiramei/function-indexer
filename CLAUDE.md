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

## Important Implementation Details

1. **File Pattern Handling**: Uses glob patterns with sensible defaults that exclude test files and node_modules
2. **Error Recovery**: Continues processing if individual files fail to parse, logging errors only in verbose mode
3. **Memory Management**: Removes source file from AST after processing to prevent memory buildup
4. **Hash Generation**: Uses SHA-256 hashing truncated to 8 characters for tracking changes

## PR Review Response Rules

For detailed PR review response procedures, refer to: `.docs/pr-review-rules.md`

This document contains:
- Complete workflow for handling PR reviews
- Required tools and commands
- Forbidden patterns and best practices
- Troubleshooting guides

Key points:
- Always use `pr-review-processor.ts` and `pr-review-tracker.ts` from ai-tools
- Follow the structured workflow: Analyze → Track → Fix → Record → Verify
- Never use unstructured commands like `gh pr view`