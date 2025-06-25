---
name: Reorganize metrics commands with clear subcommand structure
about: Restructure metrics-related commands for better organization
title: "Reorganize metrics commands with clear subcommand structure"
labels: enhancement, metrics, refactoring
assignees: ''
---

## 🎯 Issue Summary

Reorganize the current scattered metrics-related commands into a clear subcommand structure under `function-indexer metrics` to separate quality tracking from core function indexing functionality.

## 🚨 Problem Statement

**Current Issues**:
1. **Mixed command structure** - Metrics commands are scattered at top level
2. **Unclear purpose separation** - Function indexing and metrics quality tracking are mixed
3. **Poor discoverability** - Hard to find all metrics-related functionality
4. **Inconsistent naming** - Various naming patterns across metrics commands

**Current Scattered Commands**:
```bash
function-indexer metrics               # Quality overview
function-indexer collect-metrics      # Data collection  
function-indexer show-metrics         # History display
function-indexer analyze-trends       # Trend analysis
function-indexer pr-metrics           # PR-specific metrics
```

## 🎯 Proposed Solution

### New Unified Structure
```bash
# Main metrics command with subcommands
function-indexer metrics                    # Overview (default)
function-indexer metrics collect           # Data collection
function-indexer metrics show [function]   # History display  
function-indexer metrics trends            # Trend analysis
function-indexer metrics pr <number>       # PR-specific metrics
function-indexer metrics thresholds        # Show/set thresholds
```

### Clear Purpose Separation
- **Core Commands**: `index`, `list`, `search` → Function discovery
- **Metrics Commands**: `metrics *` → Quality tracking and analysis
- **Development Commands**: `diff`, `report`, `ci` → Development workflow support

## 🔧 Implementation Details

### Files to Modify
- [ ] `src/cli.ts` - Restructure command definitions
- [ ] `src/commands/metrics.ts` - New unified metrics command
- [ ] Existing metric command files - Refactor as subcommands

### New Command Structure

#### 1. Main Metrics Command with Subcommands
```typescript
// src/commands/metrics.ts
export function createMetricsCommand(): Command {
  const metricsCmd = new Command('metrics')
    .description('Code quality metrics and analysis');

  // Subcommands
  metricsCmd.addCommand(createCollectCommand());
  metricsCmd.addCommand(createShowCommand());
  metricsCmd.addCommand(createTrendsCommand());
  metricsCmd.addCommand(createPRCommand());
  metricsCmd.addCommand(createThresholdsCommand());

  // Default action - show overview
  metricsCmd.action(async (options) => {
    await showMetricsOverview(options);
  });

  return metricsCmd;
}
```

#### 2. Individual Subcommands
```typescript
function createCollectCommand(): Command {
  return new Command('collect')
    .description('Collect code metrics for commit/PR tracking')
    .option('-r, --root <path>', 'root directory to scan', './src')
    .option('--pr <number>', 'PR number for this metrics collection')
    .option('--commit <hash>', 'specific commit hash')
    .action(async (options) => {
      await executeMetricsCollection(options);
    });
}

function createShowCommand(): Command {
  return new Command('show')
    .description('Show metrics history for functions')
    .argument('[functionId]', 'Function to show metrics for')
    .option('-l, --limit <number>', 'limit number of entries', '10')
    .option('--list', 'list all functions with metrics')
    .action(async (functionId, options) => {
      await showFunctionMetrics(functionId, options);
    });
}
```

### Backward Compatibility
```typescript
// Maintain aliases for existing commands during transition
program
  .command('collect-metrics')
  .description('[DEPRECATED] Use "metrics collect" instead')
  .action(() => {
    console.warn(chalk.yellow('⚠️  "collect-metrics" is deprecated. Use "function-indexer metrics collect" instead.'));
    // Delegate to new command
  });
```

## 📋 Acceptance Criteria

### Functional Requirements
- [ ] `function-indexer metrics` shows quality overview (current behavior)
- [ ] All subcommands work identically to current commands
- [ ] Backward compatibility with deprecation warnings
- [ ] Consistent help and error messages across subcommands
- [ ] All existing functionality preserved

### Command Structure
- [ ] `metrics collect` replaces `collect-metrics`
- [ ] `metrics show` replaces `show-metrics`  
- [ ] `metrics trends` replaces `analyze-trends`
- [ ] `metrics pr` replaces `pr-metrics`
- [ ] `metrics thresholds` for threshold management (new)

### User Experience
- [ ] Clear help text for main metrics command
- [ ] Subcommand discovery through help system
- [ ] Deprecation warnings for old commands
- [ ] Smooth migration path for existing users

## 🎯 Benefits

### For Developers
1. **Clear organization** - Easy to find all quality-related functionality
2. **Logical grouping** - Related commands grouped together
3. **Better discoverability** - Single entry point for metrics features
4. **Consistent interface** - Uniform command patterns

### For AI Assistants
1. **Predictable structure** - Easy to understand command hierarchy
2. **Focused functionality** - Clear separation of concerns
3. **Better documentation** - Organized help system
4. **Simplified integration** - Single namespace for quality features

## 🔧 Technical Implementation

### Command Registration
```typescript
// src/cli.ts
import { createMetricsCommand } from './commands/metrics';

// Replace individual metric commands with unified command
program.addCommand(createMetricsCommand());

// Add deprecation aliases
program
  .command('collect-metrics')
  .description('[DEPRECATED] Use "metrics collect"')
  .action(() => redirectToNewCommand('metrics collect'));
```

### Subcommand Implementation
```typescript
// src/commands/metrics/index.ts
export function createMetricsCommand(): Command {
  const cmd = new Command('metrics')
    .description('Code quality metrics and analysis tools');

  // Add all subcommands
  cmd.addCommand(require('./collect').createCollectCommand());
  cmd.addCommand(require('./show').createShowCommand());
  cmd.addCommand(require('./trends').createTrendsCommand());
  cmd.addCommand(require('./pr').createPRCommand());

  return cmd;
}
```

### Migration Helpers
```typescript
function redirectToNewCommand(newCommand: string) {
  console.log(chalk.yellow(`⚠️  This command is deprecated.`));
  console.log(chalk.blue(`💡 Use: function-indexer ${newCommand}`));
  console.log('');
  
  // Show help for new command
  program.parse(['node', 'function-indexer', ...newCommand.split(' '), '--help']);
}
```

## 📚 Documentation Updates

### Files to Update
- [ ] `README.md` - Update command examples
- [ ] `docs/AI-GUIDE.md` - New command structure
- [ ] `docs/COMMAND-REFERENCE.md` - Reorganized metrics section
- [ ] CLI help text - Consistent descriptions

### Documentation Structure
```markdown
## Metrics Commands

### Overview
- `function-indexer metrics` - Quality overview

### Data Collection  
- `function-indexer metrics collect` - Collect metrics for tracking

### Analysis
- `function-indexer metrics show` - Function history
- `function-indexer metrics trends` - Trend analysis
- `function-indexer metrics pr` - PR metrics
```

## 🧪 Testing Strategy

### Unit Tests
- [ ] Command registration and routing
- [ ] Subcommand functionality
- [ ] Backward compatibility
- [ ] Help text generation

### Integration Tests
- [ ] End-to-end workflows with new commands
- [ ] Migration from old commands
- [ ] Error handling and edge cases

### Migration Testing
- [ ] Existing scripts using old commands
- [ ] Deprecation warning display
- [ ] Help system navigation

## 🔗 Related Issues

- Issue #5: Separate metrics and indexing configurations
- Issue #6: AI Assistant Master Guide (documentation updates)
- Issue #7: Command reference optimization

## ⚠️ Breaking Changes

### Minimal Breaking Impact
- Old commands still work with deprecation warnings
- Functionality remains identical
- Gradual migration path provided

### Deprecation Timeline
1. **Phase 1**: Introduce new structure with aliases
2. **Phase 2**: Add deprecation warnings  
3. **Phase 3**: Remove old commands (future release)

## 💡 Future Enhancements

- **Interactive metrics mode** - TUI for exploring metrics
- **Metrics plugins** - Extensible metrics system
- **Custom thresholds** - Per-project threshold configuration
- **Metrics export** - Export to external monitoring systems

## 📊 Migration Examples

### Before (Current)
```bash
function-indexer collect-metrics --pr 123
function-indexer show-metrics "src/file.ts:functionName"
function-indexer analyze-trends
function-indexer pr-metrics 123
```

### After (New Structure)
```bash
function-indexer metrics collect --pr 123
function-indexer metrics show "src/file.ts:functionName"  
function-indexer metrics trends
function-indexer metrics pr 123
```