---
name: Add list command for comprehensive function enumeration
about: Implement list command to display all functions without limit
title: "Add `list` command for comprehensive function enumeration"
labels: enhancement, core-feature, ai-optimization
assignees: ''
---

## 🎯 Issue Summary

Add a new `list` command that allows comprehensive enumeration of all functions in the codebase without the current 10-item limit restriction found in the `search` command. This is critical for AI assistants to understand the complete project structure.

## 🚨 Problem Statement

**Current Issue**: The `search` command has a default 10-item limit, making it impossible to view all functions in a project. This severely limits AI assistants' ability to understand the complete codebase structure.

**Impact**: 
- AI assistants cannot get a complete overview of available functions
- Developers must make multiple search queries to discover functions
- Poor discoverability of project functionality

## 🎯 Proposed Solution

### New Command Structure
```bash
# Basic usage - show all functions
function-indexer list

# With options
function-indexer list --format simple
function-indexer list --file "src/**/*.ts"
function-indexer list --exported
function-indexer list --async
```

### Command Options
- `--format <format>` : Output format
  - `default` : Standard format with metrics
  - `simple` : AI-optimized format (`file:line:functionName`)
  - `json` : JSON array output
- `--file <pattern>` : Filter by file pattern (glob supported)
- `--exported` : Show only exported functions
- `--async` : Show only async functions
- `--sort <field>` : Sort by field (name, file, complexity, etc.)

### Output Examples

**Default format:**
```
src/indexer.ts:25:FunctionIndexer.run ✓ ⚡
src/indexer.ts:45:FunctionIndexer.processFile ✓
src/cli.ts:15:parseArguments ✓
...
```

**Simple format (AI-optimized):**
```
src/indexer.ts:25:FunctionIndexer.run
src/indexer.ts:45:FunctionIndexer.processFile
src/cli.ts:15:parseArguments
...
```

## 🔧 Implementation Details

### Files to Modify
- [ ] `src/cli.ts` - Add new command definition
- [ ] `src/commands/list.ts` - New command implementation
- [ ] `src/search.ts` - Extract common functionality

### Key Requirements
1. **No limit by default** - Display all functions found
2. **Performance optimization** - Handle large codebases efficiently
3. **Filtering capabilities** - Multiple filter options
4. **AI-friendly output** - Simple format option for AI consumption
5. **Consistent with existing patterns** - Follow current command structure

### Technical Implementation
```typescript
// New command structure
export function createListCommand(): Command {
  return new Command('list')
    .description('List all functions in the codebase')
    .option('--format <format>', 'Output format (default, simple, json)', 'default')
    .option('--file <pattern>', 'Filter by file pattern')
    .option('--exported', 'Show only exported functions')
    .option('--async', 'Show only async functions')
    .option('--sort <field>', 'Sort by field', 'file')
    .action(async (options) => {
      await executeList(options);
    });
}
```

## 📋 Acceptance Criteria

- [ ] `function-indexer list` shows all functions without limit
- [ ] `--format simple` provides AI-optimized output
- [ ] Filtering options work correctly (--file, --exported, --async)
- [ ] Performance is acceptable for large codebases (1000+ functions)
- [ ] Output is consistent with existing command patterns
- [ ] Help documentation is comprehensive
- [ ] Unit tests cover all functionality
- [ ] Integration tests verify end-to-end behavior

## 🤖 AI Benefits

This command will enable AI assistants to:
1. **Understand complete project structure** in a single command
2. **Generate accurate code suggestions** based on existing functions
3. **Provide better refactoring recommendations** with full context
4. **Offer more relevant function discovery** during development

## 📚 Documentation Updates

- [ ] Update `docs/AI-GUIDE.md` with new command
- [ ] Add usage examples to `README.md`
- [ ] Create command reference entry
- [ ] Update CLI help text

## 🔗 Related Issues

This issue is part of the core functionality improvement initiative. Related:
- Issue #2: Improve search command
- Issue #3: Move index file to project root
- Issue #6: AI Assistant Master Guide

## 💡 Future Enhancements

- Interactive mode for function selection
- Export functionality (CSV, Excel)
- Integration with IDE extensions
- Function dependency mapping