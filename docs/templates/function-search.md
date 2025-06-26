# Function Search Template

## Purpose
Quickly find functions in a codebase based on specific criteria like name patterns, functionality, or implementation details.

## Basic Usage

### 1. Initial Setup
```bash
# Generate or update the function index
fx

# Quick search for functions
fx s "authentication"
fx s "validate.*email"  # Regex supported
```

### 2. Advanced Search Patterns

#### Search by Function Purpose
```bash
# Find authentication-related functions
fx s "auth|login|logout|session"

# Find validation functions
fx s "validate|verify|check"

# Find API endpoints
fx s "handle.*request|route|endpoint"
```

#### Search in Specific Files
```bash
# List functions in specific file patterns
fx ls --filter "**/*controller*"
fx ls --filter "src/api/**/*.ts"

# Search within specific domains
fx s "user" --filter "src/models/**"
```

### 3. AI-Optimized Workflows

#### Comprehensive Function Discovery
```bash
# Step 1: Generate fresh index
fx --verbose

# Step 2: Search with context
fx s "payment" | head -20

# Step 3: Get detailed view
fx ls --exported | grep -i payment
```

#### Function Relationship Analysis
```bash
# Find all exported functions
fx ls --exported --json > exported-functions.json

# Find async functions for performance review
fx ls --async

# Combine with metrics for quality insights
fx m
fx metrics show "path/to/file.ts:functionName"
```

### 4. Common Use Cases

#### Feature Implementation
```yaml
Task: "Implement user authentication"
Commands:
  - fx s "auth|login|session|token"
  - fx ls --filter "**/auth/**" --exported
  - fx metrics show "existing-auth-function"
```

#### Bug Investigation
```yaml
Task: "Fix email validation bug"
Commands:
  - fx s "email.*valid|valid.*email"
  - fx ls --filter "**/*validator*"
  - grep -n "email" function-index.jsonl
```

#### Refactoring Preparation
```yaml
Task: "Refactor user service"
Commands:
  - fx ls --filter "**/user/**" --json
  - fx s "user" --exported
  - fx metrics trends | grep user
```

### 5. Output Processing

#### JSON Processing with jq
```bash
# Get function names only
fx ls --json | jq -r '.[].identifier'

# Find functions with high complexity
fx ls --json | jq '.[] | select(.metrics.cyclomaticComplexity > 10)'

# Export function signatures
fx ls --exported --json | jq -r '.[] | "\(.file):\(.startLine) - \(.signature)"'
```

#### Integration with Other Tools
```bash
# Open all files containing "validate" functions in VSCode
fx s "validate" | awk -F: '{print $1}' | sort -u | xargs code

# Generate documentation stubs
fx ls --exported --json | jq -r '.[] | "## \(.identifier)\n\n\(.signature)\n"'
```

### 6. Best Practices

1. **Keep Index Fresh**: Run `fx` before important searches
2. **Use Regex Wisely**: Simple patterns are often more effective
3. **Combine Tools**: Use with `grep`, `jq`, and editor integrations
4. **Filter Early**: Use `--filter` to reduce noise
5. **Export for Analysis**: Use `--json` for programmatic processing

### 7. Troubleshooting

```bash
# Verify index exists
ls -la .function-index/

# Check index freshness
stat .function-index/function-index.jsonl

# Debug search patterns
fx s "pattern" --verbose

# Validate index integrity
fx validate
```

## Quick Reference Card

| Task | Command |
|------|---------|
| Update index | `fx` |
| Quick search | `fx s "pattern"` |
| List all functions | `fx ls` |
| Exported only | `fx ls --exported` |
| Async functions | `fx ls --async` |
| Specific files | `fx ls --filter "**/*test*"` |
| JSON output | `fx ls --json` |
| With metrics | `fx m` |