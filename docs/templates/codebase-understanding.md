# Codebase Understanding Template

## Purpose
Quickly understand the structure, architecture, and key components of a codebase using Function Indexer's analysis capabilities.

## Basic Usage

### 1. Initial Codebase Overview
```bash
# Generate comprehensive index
fx --verbose

# Get high-level metrics
fx m

# Count total functions
fx ls --json | jq length

# View directory structure with function counts
fx ls --json | jq -r '.[].file' | xargs dirname | sort | uniq -c | sort -nr
```

### 2. Architecture Discovery

#### Entry Points and Main Functions
```bash
# Find main/index files
fx ls --filter "**/index.*" --exported

# Locate CLI entry points
fx s "main|cli|entry|bootstrap|start"

# Find initialization functions
fx s "init|setup|config|bootstrap" --exported
```

#### API and Route Discovery
```bash
# Find API endpoints
fx s "route|endpoint|handler|controller" --filter "**/api/**"

# List all controllers
fx ls --filter "**/*controller*" --exported

# Discover middleware
fx s "middleware|interceptor|filter"
```

### 3. Domain Analysis

#### Business Logic Identification
```bash
# Group functions by domain
fx ls --json | jq -r '.[].file' | sed 's/.*\/\([^\/]*\)\/.*/\1/' | sort | uniq -c | sort -nr

# Find service layer
fx ls --filter "**/services/**" --exported

# Identify models/entities
fx ls --filter "**/models/**" --exported
fx ls --filter "**/entities/**" --exported
```

#### Core Functionality Mapping
```bash
# Find validation logic
fx s "validate|verify|check" | grep -v test

# Locate authentication/authorization
fx s "auth|permission|role|access"

# Discover data processing
fx s "process|transform|convert|parse"
```

### 4. AI-Optimized Codebase Analysis

#### Comprehensive Architecture Report
```bash
#!/bin/bash
# generate-architecture-report.sh

echo "# Codebase Architecture Report"
echo "Generated: $(date)"
echo

# 1. Overview Statistics
echo "## Overview"
total_files=$(fx ls --json | jq -r '.[].file' | sort -u | wc -l)
total_functions=$(fx ls --json | jq length)
exported_functions=$(fx ls --exported --json | jq length)
async_functions=$(fx ls --async --json | jq length)

echo "- Total Files: $total_files"
echo "- Total Functions: $total_functions"
echo "- Exported Functions: $exported_functions"
echo "- Async Functions: $async_functions"
echo

# 2. Directory Structure
echo "## Directory Structure (by function count)"
fx ls --json | jq -r '.[].file' | xargs dirname | sort | uniq -c | sort -nr | head -20
echo

# 3. Key Components
echo "## Key Components"
echo "### Entry Points"
fx ls --filter "**/index.*" --exported --json | jq -r '.[] | "- \(.file):\(.identifier)"' | head -10

echo "### Services"
fx ls --filter "**/service*/**" --exported --json | jq -r '.[] | "- \(.file):\(.identifier)"' | head -10

echo "### Controllers/Handlers"
fx ls --filter "**/*controller*" --exported --json | jq -r '.[] | "- \(.file):\(.identifier)"' | head -10
echo

# 4. Complexity Analysis
echo "## Complexity Overview"
echo "### Most Complex Functions"
fx ls --json | jq -r '.[] | "\(.metrics.cyclomaticComplexity)\t\(.file):\(.identifier)"' | sort -nr | head -10

echo "### Largest Functions"
fx ls --json | jq -r '.[] | "\(.metrics.linesOfCode)\t\(.file):\(.identifier)"' | sort -nr | head -10
```

#### Dependency Analysis
```bash
# Find utility functions (used across modules)
fx ls --json | jq -r '.[] | select(.exported == true and .metrics.parameterCount <= 2) | .identifier' | sort | uniq -c | sort -nr | head -20

# Identify shared types/interfaces
fx s "interface|type|enum" --filter "**/types/**"

# Locate configuration functions
fx s "config|options|settings" --exported
```

### 5. Technology Stack Discovery

#### Framework Detection
```bash
# React components
fx s "Component|useState|useEffect" --filter "**/*.tsx"

# Express routes
fx s "router\.|app\.(get|post|put|delete)"

# Database queries
fx s "query|insert|update|delete|select" --filter "**/db/**"
```

#### Pattern Recognition
```bash
# Find decorators (NestJS, TypeORM, etc.)
fx s "@\w+\(" 

# Locate async patterns
fx ls --async --json | jq -r '.[] | "\(.file):\(.identifier)"'

# Error handling patterns
fx s "catch|error|exception"
```

### 6. Code Organization Insights

#### Module Boundaries
```bash
# Analyze module exports
for dir in $(find src -type d -maxdepth 2); do
  echo "Module: $dir"
  fx ls --filter "$dir/**" --exported --json | jq length
done

# Cross-module dependencies
fx ls --exported --json | jq -r '.[] | .file' | sed 's/\/[^\/]*$//' | sort | uniq -c
```

#### Naming Conventions
```bash
# Analyze function naming patterns
fx ls --json | jq -r '.[].identifier' | sed 's/[A-Z]/ &/g' | awk '{print $1}' | sort | uniq -c | sort -nr | head -20

# Find test files
fx ls --filter "**/*.test.*" --json | jq length
fx ls --filter "**/*.spec.*" --json | jq length
```

### 7. Quick Understanding Workflows

#### New Developer Onboarding
```yaml
Task: "Understand project structure"
Steps:
  1. Overview: fx m
  2. Entry points: fx ls --filter "**/index.*" --exported
  3. Main features: fx ls --filter "**/services/**" | head -20
  4. Complex areas: fx ls --json | jq '.[] | select(.metrics.cyclomaticComplexity > 10)'
  5. Recent changes: fx metrics trends
```

#### Feature Location
```yaml
Task: "Find authentication implementation"
Commands:
  - fx s "login|signin|authenticate"
  - fx s "jwt|token|session"
  - fx ls --filter "**/auth/**"
  - fx metrics show "auth-function-name"
```

### 8. Visual Analysis

#### Generate Complexity Heatmap Data
```bash
# Export for visualization
fx ls --json | jq '[.[] | {
  file: .file,
  function: .identifier,
  complexity: .metrics.cyclomaticComplexity,
  size: .metrics.linesOfCode,
  depth: .metrics.nestingDepth
}]' > complexity-data.json
```

#### Directory Tree with Metrics
```bash
# Create annotated tree
find src -type f -name "*.ts" -o -name "*.tsx" | while read file; do
  count=$(fx ls --filter "$file" --json 2>/dev/null | jq length)
  complexity=$(fx ls --filter "$file" --json 2>/dev/null | jq '[.[] | .metrics.cyclomaticComplexity] | add')
  echo "$file: $count functions, total complexity: $complexity"
done | sort
```

### 9. Best Practices

1. **Start Broad**: Get overview before diving deep
2. **Follow Exports**: Exported functions reveal public API
3. **Check Complexity**: High complexity indicates core logic
4. **Use Filters**: Focus on specific areas of interest
5. **Combine Metrics**: Cross-reference different analyses

### 10. Integration Examples

#### VSCode Task
```json
{
  "label": "Analyze Codebase",
  "type": "shell",
  "command": "fx m && fx ls --exported | head -20",
  "problemMatcher": []
}
```

#### Documentation Generator
```bash
# Generate module documentation
for module in src/*/; do
  echo "## Module: $(basename $module)"
  echo
  fx ls --filter "$module**" --exported --json | \
    jq -r '.[] | "### \(.identifier)\n`\(.signature)`\n"'
done > modules.md
```

## Quick Reference Card

| Task | Command |
|------|---------|
| Codebase overview | `fx m` |
| Count functions | `fx ls --json \| jq length` |
| Find entry points | `fx ls --filter "**/index.*" --exported` |
| Locate services | `fx ls --filter "**/service*/**"` |
| Complex functions | `fx ls --json \| jq '.[] \| select(.metrics.cyclomaticComplexity > 10)'` |
| Directory analysis | `fx ls --json \| jq -r '.[].file' \| xargs dirname \| sort \| uniq -c` |
| Export analysis | `./generate-architecture-report.sh > report.md` |