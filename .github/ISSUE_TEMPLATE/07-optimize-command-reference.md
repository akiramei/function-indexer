---
name: Optimize command reference for AI consumption
about: Create AI-optimized command reference with categorization and specifications
title: "Optimize command reference for AI consumption"
labels: documentation, command-reference, ai-optimization
assignees: ''
---

## 🎯 Issue Summary

Create a comprehensive, AI-optimized command reference that categorizes all Function Indexer commands by purpose and provides complete specifications for AI assistants to understand and use effectively.

## 🚨 Problem Statement

**Current Issues**:
1. **No centralized command reference** - Commands scattered across multiple docs
2. **Inconsistent documentation** - Different detail levels across commands
3. **No AI-friendly categorization** - No clear priority or usage frequency indicators
4. **Missing output specifications** - Incomplete documentation of command outputs
5. **Poor discoverability** - Hard for AI to understand command relationships

**Impact on AI Usage**:
- AI assistants must piece together command information from multiple sources
- Inconsistent command usage patterns
- Suboptimal command selection for specific tasks
- Difficulty understanding command output formats

## 🎯 Proposed Solution

### Comprehensive Command Reference
Create `docs/COMMAND-REFERENCE.md` with AI-optimized organization:

1. **Categorized by function** - Core, Metrics, Development, Management
2. **Priority indicators** - Usage frequency and importance levels
3. **Complete specifications** - All options, outputs, and examples
4. **AI-friendly format** - Easy to parse and understand
5. **Cross-references** - Clear relationships between commands

## 🔧 Implementation Details

### Document Structure

```markdown
# Function Indexer - Complete Command Reference

## 🎯 Command Categories

### 🔍 Core Commands (High Priority - Daily Use)
Function discovery and indexing - 90% of AI usage

### 📊 Metrics Commands (Medium Priority - Quality Focus)
Code quality analysis and tracking - 10% of AI usage

### 🔧 Development Commands (Medium Priority - Workflow Integration)
CI/CD and development workflow support

### 🛠️ Management Commands (Low Priority - Maintenance)
Backup, repair, and maintenance operations
```

### Command Documentation Template

For each command, provide:
```markdown
### `command-name`

**Purpose**: Brief description of what it does
**Category**: Core/Metrics/Development/Management
**Priority**: High/Medium/Low
**AI Usage**: Common scenarios for AI assistants

#### Syntax
```bash
function-indexer command-name [arguments] [options]
```

#### Arguments
- `argument` - Description and requirements

#### Options
- `--option` - Description, default value, type
- `--flag` - Boolean flag description

#### Output Format
- Description of output structure
- JSONL/JSON schema if applicable
- Example output

#### Examples
```bash
# Common usage
function-indexer command-name example

# Advanced usage  
function-indexer command-name --advanced-option
```

#### AI Integration Notes
- How AI should typically use this command
- Common patterns and workflows
- Output processing recommendations
```

### Core Commands Section (High Priority)

```markdown
## 🔍 Core Commands (High Priority)

### `function-indexer` (default command)
**Purpose**: Generate or update function index
**Priority**: High
**AI Usage**: First command to run, project initialization

#### Syntax
```bash
function-indexer [options]
```

#### Options
- `--root, -r <path>` - Root directory to scan (string, default: auto-detected)
- `--output, -o <file>` - Output file path (string, default: function-index.jsonl)
- `--verbose, -v` - Verbose output (boolean, default: false)

#### Output
- Creates JSONL file with function index
- Displays summary statistics
- Shows any warnings or errors

#### Example Output
```
✅ Indexing completed!
📁 Files processed: 45
🔧 Functions found: 216
⏱️ Execution time: 1.2s
```

#### AI Integration Notes
- Run this first to establish function index
- Check output file exists before other operations
- Use --verbose for debugging issues
```

### Metrics Commands Section (Medium Priority)

```markdown
## 📊 Metrics Commands (Medium Priority)

### `metrics` (overview)
**Purpose**: Show code quality metrics overview
**Priority**: Medium
**AI Usage**: Quality assessment, code review preparation

#### Syntax
```bash
function-indexer metrics [options]
```

#### Options
- `--details, -d` - Show detailed function-level metrics (boolean)

#### Output Format
```json
{
  "summary": {
    "totalFunctions": 216,
    "highComplexity": 12,
    "avgComplexity": 3.4
  },
  "distribution": {
    "low": 180,
    "medium": 24,
    "high": 12
  },
  "violations": [...]
}
```

#### AI Integration Notes
- Use for code quality assessment
- Focus on high-risk functions first
- Combine with function search for targeted analysis
```

## 📋 Acceptance Criteria

### Content Requirements
- [ ] All commands documented with complete specifications
- [ ] Clear categorization by purpose and priority
- [ ] Consistent documentation template across all commands
- [ ] Complete output format specifications
- [ ] AI integration notes for each command
- [ ] Cross-references between related commands

### Organization Requirements
- [ ] Commands grouped by functional category
- [ ] Priority levels clearly indicated
- [ ] Usage frequency guidance provided
- [ ] Logical flow from basic to advanced usage
- [ ] Quick reference summary section

### AI Optimization Requirements
- [ ] Machine-readable structure (consistent markdown)
- [ ] Copy-paste ready examples
- [ ] Output format schemas where applicable
- [ ] Integration pattern recommendations
- [ ] Common workflow documentation

## 🤖 AI Benefits

### Improved Command Selection
AI assistants will be able to:
1. **Choose optimal commands** for specific tasks
2. **Understand command relationships** and workflows
3. **Use appropriate options** based on context
4. **Process outputs correctly** with complete specifications

### Better Integration Patterns
1. **Consistent usage** across different AI implementations
2. **Efficient workflows** using command combinations
3. **Proper error handling** with documented error conditions
4. **Optimized performance** using best practices

## 🔧 Implementation Plan

### Phase 1: Core Documentation
- [ ] Create basic document structure
- [ ] Document all core commands (indexer, search, list)
- [ ] Add priority and category information
- [ ] Include basic examples

### Phase 2: Complete Command Coverage
- [ ] Document all metrics commands
- [ ] Add development workflow commands
- [ ] Include management and utility commands
- [ ] Add cross-references and relationships

### Phase 3: AI Optimization
- [ ] Add AI integration notes to each command
- [ ] Create workflow examples
- [ ] Add output format schemas
- [ ] Optimize for machine readability

### Phase 4: Testing and Refinement
- [ ] Test with AI assistant interactions
- [ ] Validate all examples and outputs
- [ ] Refine based on usage patterns
- [ ] Add missing edge cases

## 📊 Detailed Command Categories

### 🔍 Core Commands (High Priority)
```markdown
1. `function-indexer` - Generate/update index
2. `list` - List all functions (Issue #1)
3. `search` - Search for functions (Issue #2)  
4. `update` - Update existing index
```

### 📊 Metrics Commands (Medium Priority)
```markdown
1. `metrics` - Quality overview
2. `metrics collect` - Collect metrics data
3. `metrics show` - Function history
4. `metrics trends` - Trend analysis
5. `metrics pr` - PR-specific metrics
```

### 🔧 Development Commands (Medium Priority)
```markdown
1. `diff` - Compare between branches/commits
2. `report` - Generate quality reports
3. `ci` - CI/CD integration
4. `generate-descriptions` - AI function descriptions
```

### 🛠️ Management Commands (Low Priority)
```markdown
1. `validate` - Validate index integrity
2. `repair` - Repair corrupted index
3. `backup` - Create index backup
4. `restore` - Restore from backup
5. `update-all` - Update all indexes
```

## 📚 Documentation Structure

### Main Sections
```markdown
# Command Reference

## Quick Reference Table
| Command | Category | Priority | Purpose |
|---------|----------|----------|---------|

## Core Commands (Daily Use)
### Detailed documentation for each

## Metrics Commands (Quality Focus)  
### Detailed documentation for each

## Development Commands (Workflow Integration)
### Detailed documentation for each

## Management Commands (Maintenance)
### Detailed documentation for each

## Command Combinations & Workflows
### Common patterns and examples

## Output Format Specifications
### Complete schemas and examples

## Error Handling & Troubleshooting
### Common issues and solutions
```

## 🧪 Testing Strategy

### Documentation Quality
- [ ] Technical accuracy verification
- [ ] Example command execution
- [ ] Output format validation
- [ ] Cross-reference verification

### AI Assistant Testing  
- [ ] Test command selection guidance
- [ ] Validate AI integration notes
- [ ] Check workflow recommendations
- [ ] Verify output processing examples

### Usability Testing
- [ ] Navigation and findability
- [ ] Completeness checking
- [ ] Consistency review
- [ ] Mobile/desktop readability

## 🔗 Related Issues

This command reference will support:
- Issue #1: Add list command (document new command)
- Issue #2: Improve search command (update documentation)
- Issue #4: Reorganize metrics commands (document new structure)
- Issue #6: AI Assistant Master Guide (provide detailed reference)

## 💡 Future Enhancements

### Interactive Features
- [ ] Command builder tool
- [ ] Interactive examples
- [ ] Command completion scripts
- [ ] Integration with CLI help system

### Advanced Documentation
- [ ] Video demonstrations
- [ ] Interactive tutorials
- [ ] API documentation
- [ ] Plugin development guide

## 📋 Quality Standards

### Technical Accuracy
- All examples must be executable and produce expected output
- Output formats must match actual command behavior
- Options and arguments must be current and complete

### AI Optimization
- Clear priority indicators for command selection
- Machine-readable structure for automated parsing
- Integration patterns for common AI workflows
- Performance considerations and best practices

### Completeness
- Every command documented
- All options and arguments covered
- Error conditions and troubleshooting included
- Cross-references to related functionality