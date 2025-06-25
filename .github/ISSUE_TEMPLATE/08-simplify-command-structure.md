---
name: Simplify command structure for better usability
about: Improve UX with simplified commands, better help, and enhanced error messages
title: "Simplify command structure for better usability"
labels: enhancement, ux, commands
assignees: ''
---

## 🎯 Issue Summary

Improve the overall user experience by simplifying frequently used commands, enhancing help messages, and providing clearer error messages to make Function Indexer more accessible to both developers and AI assistants.

## 🚨 Problem Statement

**Current UX Issues**:
1. **Verbose command structure** - Common tasks require long command names
2. **Inconsistent help messages** - Different quality and detail levels across commands
3. **Poor error messages** - Generic errors without actionable guidance
4. **No command shortcuts** - Frequently used commands are cumbersome
5. **Overwhelming options** - Too many options presented without priority guidance

**Real-world Impact**:
```bash
# Current: Verbose and hard to remember
npx @akiramei/function-indexer collect-metrics --root ./src --pr 123

# Desired: Simple and intuitive  
npx @akiramei/function-indexer metrics --pr 123
```

## 🎯 Proposed Solution

### Simplified Command Aliases
```bash
# Core operations (shortened)
function-indexer                    # Generate/update index
function-indexer ls                 # List functions (alias for list)
function-indexer find <query>       # Search functions (alias for search)

# Common workflows (simplified)
function-indexer quality            # Show metrics overview
function-indexer check              # Quick quality check
function-indexer status             # Project status overview
```

### Improved Help System
```bash
# Context-aware help
function-indexer --help             # Basic overview with common commands
function-indexer search --help      # Detailed search options
function-indexer --examples         # Show common usage examples
```

### Enhanced Error Messages
```bash
# Before: Generic error
Error: Index file not found

# After: Actionable guidance
❌ Index file not found: function-index.jsonl
💡 Run 'function-indexer' to create the index first
💡 Or specify a different path with --output
```

## 🔧 Implementation Details

### Files to Modify
- [ ] `src/cli.ts` - Add command aliases and improve help
- [ ] `src/utils/error-handler.ts` - Enhance error messages
- [ ] `src/commands/*.ts` - Standardize help and error patterns
- [ ] Package.json scripts - Add convenient npm scripts

### Command Simplification

#### 1. Core Command Aliases
```typescript
// Add popular aliases
program
  .command('ls')
  .alias('list')
  .description('List all functions in the codebase')
  .action(async (options) => {
    await executeList(options);
  });

program
  .command('find <query>')
  .alias('search')
  .description('Search for functions')
  .action(async (query, options) => {
    await executeSearch(query, options);
  });
```

#### 2. Workflow Shortcuts
```typescript
// Quick quality check
program
  .command('quality')
  .alias('q')
  .description('Quick code quality overview')
  .action(async () => {
    await executeMetricsOverview({ details: false });
  });

// Project status
program
  .command('status')
  .description('Show project indexing status')
  .action(async () => {
    await showProjectStatus();
  });
```

### Enhanced Help System

#### 1. Contextual Help
```typescript
// Improved main help
program
  .description('Function Indexer - Understand your codebase')
  .addHelpText('after', `
Common Commands:
  function-indexer              Create/update function index
  function-indexer find <query> Search for functions
  function-indexer quality      Show code quality metrics

Examples:
  function-indexer              # Index your project
  function-indexer find "auth"  # Find authentication functions
  function-indexer quality      # Check code quality

For detailed help: function-indexer <command> --help
For examples: function-indexer --examples
`);
```

#### 2. Examples Command
```typescript
program
  .option('--examples', 'Show common usage examples')
  .hook('preAction', (command) => {
    if (command.opts().examples) {
      showUsageExamples();
      process.exit(0);
    }
  });

function showUsageExamples() {
  console.log(chalk.blue('📚 Function Indexer Examples\n'));
  
  console.log(chalk.cyan('Basic Usage:'));
  console.log('  function-indexer                    # Create index');
  console.log('  function-indexer find "validation" # Find functions');
  console.log('  function-indexer quality           # Check quality\n');
  
  console.log(chalk.cyan('Development Workflow:'));
  console.log('  function-indexer diff main         # Compare branches');
  console.log('  function-indexer report --html     # Generate report\n');
}
```

### Error Message Enhancement

#### 1. Actionable Error Messages
```typescript
// Enhanced error handler
export class UserFriendlyError extends Error {
  constructor(
    message: string,
    public suggestions: string[] = [],
    public type: 'warning' | 'error' = 'error'
  ) {
    super(message);
  }
}

// Usage example
if (!fs.existsSync(indexPath)) {
  throw new UserFriendlyError(
    `Index file not found: ${indexPath}`,
    [
      "Run 'function-indexer' to create the index",
      "Check if you're in the correct directory",
      `Use --output to specify a different path`
    ]
  );
}
```

#### 2. Progressive Disclosure
```typescript
// Show minimal help initially, with options to get more
function showProgressiveHelp(command: string) {
  console.log(chalk.blue(`📖 ${command} - Quick Help`));
  console.log('Basic usage and most common options...\n');
  
  console.log(chalk.gray('For complete options: --help'));
  console.log(chalk.gray('For examples: --examples'));
  console.log(chalk.gray('For troubleshooting: --troubleshoot'));
}
```

## 📋 Acceptance Criteria

### Command Simplification
- [ ] Common commands have intuitive aliases (ls, find, quality)
- [ ] Frequently used workflows are accessible with single commands
- [ ] Command naming follows intuitive patterns
- [ ] Backward compatibility maintained for existing commands
- [ ] No breaking changes to current functionality

### Help System Improvements
- [ ] Main help shows most common commands and examples
- [ ] Each command has clear, helpful descriptions
- [ ] Examples are provided for common use cases
- [ ] Help text is consistent across all commands
- [ ] Progressive disclosure prevents information overload

### Error Message Enhancement
- [ ] All errors include actionable suggestions
- [ ] Error messages are specific and contextual
- [ ] Suggestions are relevant to the specific error
- [ ] Error formatting is consistent and readable
- [ ] Common mistakes have dedicated help

## 🎯 Benefits

### For Developers
1. **Faster command execution** - Shorter, memorable commands
2. **Better discoverability** - Intuitive command names
3. **Reduced learning curve** - Clear help and examples
4. **Improved troubleshooting** - Actionable error messages

### For AI Assistants
1. **Simplified integration** - Fewer command variations to handle
2. **Better error recovery** - Clear guidance for common issues
3. **Improved patterns** - Consistent command structure
4. **Reduced complexity** - Simpler mental model

## 🔧 Implementation Examples

### Before and After Comparison

#### Command Simplification
```bash
# Before
npx @akiramei/function-indexer collect-metrics --root ./src --pr 123
npx @akiramei/function-indexer show-metrics "src/file.ts:func"
npx @akiramei/function-indexer analyze-trends

# After
npx @akiramei/function-indexer metrics collect --pr 123
npx @akiramei/function-indexer metrics show "src/file.ts:func"
npx @akiramei/function-indexer metrics trends
```

#### Error Message Improvement
```bash
# Before
Error: Command failed
Usage: function-indexer <command> [options]

# After  
❌ Index file not found: function-index.jsonl

💡 Quick fixes:
  • Run 'function-indexer' to create the index
  • Check if you're in the project root directory
  • Use --output to specify a different location

📚 Need help? Run 'function-indexer --examples'
```

### New Convenience Commands
```typescript
// Quick status check
program
  .command('status')
  .description('Show indexing and quality status')
  .action(async () => {
    const hasIndex = fs.existsSync('function-index.jsonl');
    const hasConfig = fs.existsSync('.function-indexer/config.json');
    
    console.log(chalk.blue('📊 Project Status\n'));
    console.log(`Index file: ${hasIndex ? '✅' : '❌'} function-index.jsonl`);
    console.log(`Configuration: ${hasConfig ? '✅' : '❌'} .function-indexer/`);
    
    if (hasIndex) {
      const stats = await getIndexStats();
      console.log(`Functions: ${stats.count} (last updated: ${stats.lastModified})`);
    }
  });
```

## 📚 Documentation Updates

### Files to Update
- [ ] `README.md` - Update with simplified command examples
- [ ] `docs/QUICK-START.md` - Use new simplified commands
- [ ] `docs/AI-GUIDE.md` - Update with new command patterns
- [ ] CLI help text - Consistent formatting and content

### New Documentation
- [ ] Command cheat sheet
- [ ] Troubleshooting guide with common errors
- [ ] Migration guide for existing users

## 🧪 Testing Strategy

### Usability Testing
- [ ] Command discovery and memorability
- [ ] Help system navigation
- [ ] Error message clarity and actionability
- [ ] New user onboarding flow

### Functionality Testing
- [ ] All aliases work correctly
- [ ] Help system completeness
- [ ] Error message accuracy
- [ ] Backward compatibility

### AI Integration Testing
- [ ] Test simplified commands with AI assistants
- [ ] Validate error recovery patterns
- [ ] Check help system integration

## 🔗 Related Issues

This UX improvement supports:
- Issue #1-3: Core functionality (will have better UX)
- Issue #4: Metrics reorganization (simplified access)
- Issue #6-7: AI optimization (better patterns for AI)

## 💡 Future Enhancements

### Interactive Features
- [ ] Interactive command builder
- [ ] Auto-completion scripts
- [ ] Configuration wizard
- [ ] Progress bars for long operations

### Advanced UX
- [ ] TUI (Terminal User Interface) mode
- [ ] Command suggestions based on context
- [ ] Smart defaults based on project detection
- [ ] Integration with popular development tools

## 📊 UX Improvements Summary

### Command Frequency Optimization
```markdown
High Frequency (Daily use):
- function-indexer → Stays simple
- ls/list → Quick function listing  
- find/search → Quick function search
- quality → Quick quality check

Medium Frequency (Weekly use):
- metrics collect → Simplified from collect-metrics
- diff → Stays simple
- report → Stays simple

Low Frequency (Occasional use):
- backup/restore → Keep detailed for safety
- repair/validate → Keep explicit for clarity
```

### Error Message Standards
```markdown
Error Format:
❌ [Specific problem description]

💡 Quick fixes:
  • [Most likely solution]
  • [Alternative solution]
  • [Advanced option]

📚 [Link to relevant help/docs]
```