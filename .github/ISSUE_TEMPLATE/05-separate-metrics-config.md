---
name: Separate metrics and indexing configurations
about: Clearly separate configuration files for indexing and metrics functionality
title: "Separate metrics and indexing configurations"
labels: architecture, configuration, metrics
assignees: ''
---

## 🎯 Issue Summary

Separate the configuration and storage for function indexing and metrics functionality to provide clear distinction between core function discovery and supplementary quality tracking features.

## 🚨 Problem Statement

**Current Issues**:
1. **Mixed configuration** - Index and metrics settings are intermingled
2. **Unclear separation** - Hard to distinguish core vs. quality features
3. **Configuration complexity** - Single config file handles multiple concerns
4. **Storage confusion** - Index data and metrics data stored together

**Current Structure (Problematic)**:
```
.function-indexer/
├── config.json          # Mixed: index + metrics config
├── index.jsonl          # Index data
├── metadata/             # Index metadata  
├── search-history.db     # Search data
└── .history/             # Mixed usage
```

## 🎯 Proposed Solution

### New Separated Structure
```
project-root/
├── function-index.jsonl          # Main index (visible)
├── .function-indexer/            # Core indexing configuration
│   ├── config.json              # Index-only configuration
│   ├── metadata/                # Index metadata
│   └── search-history.db        # Search functionality
└── .function-metrics/            # Metrics configuration & data
    ├── config.json              # Metrics-only configuration
    ├── metrics.db               # Metrics history database
    └── thresholds.json          # Quality thresholds
```

### Separated Configuration Files

#### .function-indexer/config.json (Core Indexing)
```json
{
  "version": "1.0.0",
  "indexing": {
    "root": "./src",
    "output": "function-index.jsonl",
    "domain": "default",
    "include": ["**/*.ts", "**/*.tsx"],
    "exclude": ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"]
  },
  "search": {
    "historyEnabled": true,
    "aiIntegration": true
  }
}
```

#### .function-metrics/config.json (Quality Metrics)
```json
{
  "version": "1.0.0",
  "metrics": {
    "enabled": true,
    "collectOnCI": true,
    "storageRetention": "90d"
  },
  "thresholds": {
    "cyclomaticComplexity": 10,
    "cognitiveComplexity": 15,
    "linesOfCode": 40,
    "nestingDepth": 3,
    "parameterCount": 4
  },
  "reporting": {
    "format": "markdown",
    "includeHistory": true
  }
}
```

## 🔧 Implementation Details

### Files to Modify
- [ ] `src/services/config-service.ts` - Split configuration handling
- [ ] `src/services/metrics-service.ts` - Use metrics-specific config
- [ ] `src/indexer.ts` - Use indexing-specific config only
- [ ] `src/cli.ts` - Handle both configuration types

### New Configuration Services

#### 1. Indexing Configuration Service
```typescript
// src/services/indexing-config.ts
export class IndexingConfigService {
  private static readonly CONFIG_DIR = '.function-indexer';
  private static readonly CONFIG_FILE = 'config.json';

  static loadConfig(projectRoot: string): IndexingConfig {
    const configPath = path.join(projectRoot, this.CONFIG_DIR, this.CONFIG_FILE);
    // Load indexing-specific configuration
  }

  static saveConfig(config: IndexingConfig, projectRoot: string): void {
    // Save only indexing-related settings
  }
}
```

#### 2. Metrics Configuration Service  
```typescript
// src/services/metrics-config.ts
export class MetricsConfigService {
  private static readonly CONFIG_DIR = '.function-metrics';
  private static readonly CONFIG_FILE = 'config.json';
  private static readonly THRESHOLDS_FILE = 'thresholds.json';

  static loadConfig(projectRoot: string): MetricsConfig {
    // Load metrics-specific configuration
  }

  static loadThresholds(projectRoot: string): MetricsThresholds {
    // Load quality thresholds
  }
}
```

### Configuration Types
```typescript
// src/types/config.ts
export interface IndexingConfig {
  version: string;
  indexing: {
    root: string;
    output: string;
    domain: string;
    include: string[];
    exclude: string[];
  };
  search: {
    historyEnabled: boolean;
    aiIntegration: boolean;
  };
}

export interface MetricsConfig {
  version: string;
  metrics: {
    enabled: boolean;
    collectOnCI: boolean;
    storageRetention: string;
  };
  thresholds: MetricsThresholds;
  reporting: {
    format: string;
    includeHistory: boolean;
  };
}
```

## 📋 Acceptance Criteria

### Configuration Separation
- [ ] Indexing config only contains function discovery settings
- [ ] Metrics config only contains quality tracking settings
- [ ] No overlap between configuration files
- [ ] Each service uses only its relevant configuration
- [ ] Independent initialization of each subsystem

### Directory Structure
- [ ] `.function-indexer/` for core functionality only
- [ ] `.function-metrics/` for quality tracking only
- [ ] Clear separation of data files
- [ ] No mixed-purpose files or directories

### Migration Support
- [ ] Automatic migration from old unified config
- [ ] No data loss during migration
- [ ] Clear user communication about changes
- [ ] Gradual migration path for existing projects

### Backward Compatibility
- [ ] Existing workflows continue to work
- [ ] Old configuration format supported during migration
- [ ] Clear deprecation warnings for old patterns

## 🎯 Benefits

### For Developers
1. **Clear separation of concerns** - Easy to understand what each config controls
2. **Independent configuration** - Configure indexing and metrics separately
3. **Reduced complexity** - Simpler configuration files
4. **Better organization** - Logical grouping of related functionality

### For AI Assistants
1. **Focused configuration** - Can configure only needed functionality
2. **Clear documentation** - Separate guides for each feature set
3. **Reduced cognitive load** - Simpler mental model
4. **Better automation** - Independent automation of features

## 🔧 Migration Strategy

### Phase 1: Introduce New Structure
```typescript
// Support both old and new configurations
class ConfigMigration {
  static migrateFromUnified(oldConfigPath: string): {
    indexingConfig: IndexingConfig;
    metricsConfig: MetricsConfig;
  } {
    const oldConfig = JSON.parse(fs.readFileSync(oldConfigPath, 'utf8'));
    
    return {
      indexingConfig: this.extractIndexingConfig(oldConfig),
      metricsConfig: this.extractMetricsConfig(oldConfig)
    };
  }
}
```

### Phase 2: Automatic Migration
```typescript
// Detect and migrate existing configurations
export class ConfigurationManager {
  static async ensureConfiguration(projectRoot: string): Promise<void> {
    const oldConfigExists = this.hasOldConfiguration(projectRoot);
    const newConfigExists = this.hasNewConfiguration(projectRoot);
    
    if (oldConfigExists && !newConfigExists) {
      await this.migrateConfiguration(projectRoot);
    }
  }
}
```

### Phase 3: Full Transition
- Remove support for old unified configuration
- Clean up migration code
- Update all documentation

## 📚 Documentation Updates

### New Documentation Structure
```
docs/
├── configuration/
│   ├── indexing-config.md       # Core indexing setup
│   ├── metrics-config.md        # Quality metrics setup  
│   └── migration-guide.md       # Migration from old config
├── AI-GUIDE.md                  # Updated for new structure
└── COMMAND-REFERENCE.md         # Updated command examples
```

### Configuration Examples
```markdown
## Indexing Configuration

For function discovery and search functionality:

```json
// .function-indexer/config.json
{
  "indexing": {
    "root": "./src",
    "include": ["**/*.ts"]
  }
}
```

## Metrics Configuration

For code quality tracking:

```json
// .function-metrics/config.json  
{
  "thresholds": {
    "cyclomaticComplexity": 10
  }
}
```
```

## 🧪 Testing Strategy

### Unit Tests
- [ ] Configuration service separation
- [ ] Migration logic
- [ ] Independent loading/saving
- [ ] Type validation

### Integration Tests
- [ ] End-to-end workflows with separated configs
- [ ] Migration scenarios
- [ ] Independent feature operation

### Migration Testing
- [ ] Various old configuration formats
- [ ] Partial configurations
- [ ] Error handling during migration

## 🔗 Related Issues

- Issue #4: Reorganize metrics commands (complementary separation)
- Issue #6: AI Assistant Master Guide (documentation updates)
- Issue #1-3: Core functionality improvements (will use new indexing config)

## ⚠️ Breaking Changes

### Minimal Breaking Impact
- Automatic migration prevents manual changes
- Existing commands continue to work
- Configuration changes are transparent to users

### Risk Mitigation
- Comprehensive migration testing
- Clear communication in release notes
- Rollback support if needed
- Gradual transition timeline

## 💡 Future Enhancements

### Configuration Management
- **Schema validation** - JSON schema for configuration files
- **Configuration inheritance** - Project vs. global configurations
- **Environment-specific configs** - Dev/staging/prod configurations
- **Configuration UI** - Interactive configuration setup

### Advanced Features
- **Configuration versioning** - Track configuration changes
- **Configuration sharing** - Team-wide configuration templates
- **Configuration validation** - Real-time validation and suggestions
- **Plugin configurations** - Extensible configuration system

## 📊 Usage Examples

### AI Assistant Integration

**Before (Mixed Configuration)**:
```bash
# Hard to understand which settings affect what
cat .function-indexer/config.json
```

**After (Separated Configuration)**:
```bash
# Clear separation of concerns
cat .function-indexer/config.json    # For indexing features
cat .function-metrics/config.json    # For quality features
```

### Configuration Workflow
```bash
# Configure indexing only (for basic function discovery)
function-indexer init --indexing-only

# Configure metrics only (for existing projects)  
function-indexer metrics init

# Configure both (full setup)
function-indexer init --full
```