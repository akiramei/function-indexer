---
name: Move index file to project root for better visibility
about: Change default index location from hidden directory to project root
title: "Move index file to project root for better visibility"
labels: enhancement, configuration, ai-optimization
assignees: ''
---

## 🎯 Issue Summary

Move the default function index file from the hidden `.function-indexer/index.jsonl` location to the project root as `function-index.jsonl` to improve visibility and accessibility for both developers and AI assistants.

## 🚨 Problem Statement

**Current Issue**: The index file is hidden in `.function-indexer/index.jsonl`, making it:
- **Invisible to developers** - Not obvious that indexing has occurred
- **Inaccessible to AI assistants** - Harder to discover and use
- **Poor integration** - Other tools can't easily find the index
- **Inconsistent with purpose** - Index should be a visible project artifact

**Real-world Impact**:
```bash
# Current - hard to find
.function-indexer/
├── index.jsonl          # Hidden!
├── config.json
└── metadata/

# Proposed - visible and accessible
function-index.jsonl     # Visible at project root!
.function-indexer/
├── config.json
└── metadata/
```

## 🎯 Proposed Solution

### New Default Structure
```
project-root/
├── function-index.jsonl     # NEW: Main index file (visible)
├── .function-indexer/       # Configuration and metadata
│   ├── config.json         # Project configuration
│   ├── metadata/           # Index metadata
│   └── .history/           # Search history
└── .function-metrics/       # Metrics database (separate)
    └── metrics.db
```

### Configuration Changes
```json
// .function-indexer/config.json
{
  "root": "./src",
  "output": "function-index.jsonl",  // Changed from hidden path
  "domain": "default",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"]
}
```

## 🔧 Implementation Details

### Files to Modify
- [ ] `src/services/config-service.ts` - Update default paths
- [ ] `src/cli.ts` - Update initialization logic
- [ ] `src/indexer.ts` - Update default output path
- [ ] Documentation files - Update all examples

### Key Changes

#### 1. Default Output Path
```typescript
// Current
const DEFAULT_OUTPUT = '.function-indexer/index.jsonl';

// Proposed
const DEFAULT_OUTPUT = 'function-index.jsonl';
```

#### 2. Configuration Service Updates
```typescript
export class ConfigService {
  static initialize(projectRoot: string): IndexerOptions {
    const config = {
      root: this.detectSourceDirectory(projectRoot),
      output: path.join(projectRoot, 'function-index.jsonl'), // NEW
      domain: 'default',
      // ... other config
    };
    
    return config;
  }
}
```

#### 3. Migration Logic
```typescript
// Handle existing installations gracefully
private static migrateIndexLocation(projectRoot: string): void {
  const oldPath = path.join(projectRoot, '.function-indexer', 'index.jsonl');
  const newPath = path.join(projectRoot, 'function-index.jsonl');
  
  if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
    console.log('Migrating index file to project root...');
    fs.copyFileSync(oldPath, newPath);
    fs.unlinkSync(oldPath);
    console.log('✅ Index file migrated successfully');
  }
}
```

## 📋 Acceptance Criteria

### Functional Requirements
- [ ] New installations create `function-index.jsonl` in project root
- [ ] Existing installations are migrated automatically
- [ ] Configuration files reflect new default paths
- [ ] All commands work with new file location
- [ ] Backward compatibility during migration period

### Migration Requirements
- [ ] Automatic migration on first run after update
- [ ] No data loss during migration
- [ ] Clear user feedback during migration
- [ ] Graceful handling of migration failures
- [ ] Option to keep old location if desired

### Documentation Requirements
- [ ] All examples updated to show new location
- [ ] Migration guide for existing users
- [ ] .gitignore recommendations updated
- [ ] AI guide updated with new paths

## 🤖 AI Benefits

Moving the index to project root will enable:

1. **Direct file access** - AI can immediately locate the index
2. **Better project understanding** - Visible files indicate project structure
3. **Simplified workflows** - No need to search for hidden files
4. **Tool integration** - Other tools can easily discover and use the index

### AI Usage Examples
```bash
# AI can now directly access the index
cat function-index.jsonl | jq '.[] | select(.exported == true)'

# No complex path resolution needed
curl -s "file:///project/function-index.jsonl" | process-functions
```

## 🔧 Migration Strategy

### Phase 1: Introduce New Default (Non-breaking)
```typescript
// Support both locations temporarily
private getIndexPath(config: any): string {
  const newPath = path.join(this.projectRoot, 'function-index.jsonl');
  const oldPath = path.join(this.projectRoot, '.function-indexer', 'index.jsonl');
  
  // Prefer new location, fall back to old
  return fs.existsSync(newPath) ? newPath : oldPath;
}
```

### Phase 2: Automatic Migration
```typescript
// Migrate existing installations
if (this.isExistingInstallation() && !this.hasNewIndex()) {
  await this.migrateIndexFile();
}
```

### Phase 3: Full Transition
- Update all defaults
- Remove old path support
- Clean up migration code

## 📚 Documentation Updates

### Files to Update
- [ ] `README.md` - Update all examples
- [ ] `docs/AI-GUIDE.md` - New file paths
- [ ] `docs/QUICK-START.md` - Updated instructions
- [ ] `docs/TUTORIAL.md` - Revised examples
- [ ] `.env.example` - Path references

### .gitignore Template
```gitignore
# Function Indexer
function-index.jsonl     # Include or exclude based on team preference
.function-indexer/       # Always exclude configuration
.function-metrics/       # Always exclude metrics database
```

## 🧪 Testing Strategy

### Unit Tests
- [ ] Config service with new defaults
- [ ] Migration logic
- [ ] Path resolution
- [ ] Backward compatibility

### Integration Tests
- [ ] End-to-end workflows with new paths
- [ ] Migration scenarios
- [ ] Multi-project setups

### Manual Testing
- [ ] Fresh installation behavior
- [ ] Existing project migration
- [ ] AI assistant workflows

## 🔗 Related Issues

- Issue #1: Add list command (will use new file location)
- Issue #2: Improve search command (will reference new location)
- Issue #6: AI Assistant Master Guide (documentation updates)

## ⚠️ Breaking Changes

### Minimal Breaking Changes
- Default output location changes (but migration handles this)
- Documentation examples show new paths
- New installations behave differently

### Mitigation
- Automatic migration prevents data loss
- Gradual transition period
- Clear communication in release notes
- Option to override default if needed

## 💡 Future Enhancements

- **Multiple index support** - Allow multiple index files per project
- **Index versioning** - Track index format versions
- **Distributed indexing** - Support for monorepos with multiple indexes
- **Index discovery** - Automatic discovery of index files in parent directories