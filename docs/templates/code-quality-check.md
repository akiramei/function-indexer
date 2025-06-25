# Code Quality Check Template

## Purpose
Systematically analyze code quality metrics to identify technical debt, complexity hotspots, and refactoring opportunities.

## Basic Usage

### 1. Quick Quality Overview
```bash
# Get metrics summary
fx m

# Update index with fresh metrics
fx --verbose

# Collect detailed metrics
fx metrics collect --root ./src
```

### 2. Complexity Analysis

#### Identify High-Complexity Functions
```bash
# List functions sorted by complexity
fx ls --json | jq -r '.[] | select(.metrics.cyclomaticComplexity > 10) | "\(.metrics.cyclomaticComplexity)\t\(.file):\(.identifier)"' | sort -nr

# Find cognitive complexity violations
fx ls --json | jq '.[] | select(.metrics.cognitiveComplexity > 15) | {file, identifier, complexity: .metrics.cognitiveComplexity}'

# Deep nesting detection
fx ls --json | jq '.[] | select(.metrics.nestingDepth > 3)'
```

#### Analyze Specific Areas
```bash
# Check API endpoints quality
fx ls --filter "**/api/**" --json | jq '.[] | {identifier, metrics}'

# Review service layer
fx ls --filter "**/services/**" --json | jq '.[] | select(.metrics.linesOfCode > 40)'
```

### 3. Trend Analysis

#### Historical Metrics
```bash
# View function history
fx metrics show "src/auth/login.ts:validateUser"

# Analyze overall trends
fx metrics trends

# PR-specific metrics
fx metrics pr 123
```

#### Quality Gates
```bash
# Find recent violations
fx metrics trends | grep "VIOLATION"

# Check specific thresholds
fx ls --json | jq '.[] | select(.metrics.parameterCount > 4) | "\(.file):\(.identifier) has \(.metrics.parameterCount) parameters"'
```

### 4. AI-Optimized Workflows

#### Comprehensive Quality Audit
```yaml
Task: "Perform code quality audit"
Commands:
  - fx metrics collect --verbose
  - fx metrics trends
  - fx ls --json > full-metrics.json
  - jq '[.[] | select(.metrics.cyclomaticComplexity > 10 or .metrics.linesOfCode > 40)] | length' full-metrics.json
```

#### Refactoring Priority List
```yaml
Task: "Identify refactoring candidates"
Commands:
  - fx ls --json | jq -r '.[] | "\(.metrics.cyclomaticComplexity + .metrics.cognitiveComplexity)\t\(.file):\(.identifier)"' | sort -nr | head -20
  - fx metrics show "top-complex-function" --limit 10
  - fx ls --filter "target/area/**" --json | jq '.[] | select(.metrics.hasReturnType == false)'
```

### 5. Quality Metrics Reference

#### Threshold Guidelines
| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Cyclomatic Complexity | < 5 | 5-10 | > 10 |
| Cognitive Complexity | < 10 | 10-15 | > 15 |
| Lines of Code | < 25 | 25-40 | > 40 |
| Nesting Depth | ≤ 2 | 3 | > 3 |
| Parameter Count | ≤ 3 | 4 | > 4 |

### 6. Common Quality Checks

#### Type Safety Audit
```bash
# Find functions without return types
fx ls --json | jq '.[] | select(.metrics.hasReturnType == false) | "\(.file):\(.identifier)"'

# Check exported functions specifically
fx ls --exported --json | jq '.[] | select(.metrics.hasReturnType == false)'
```

#### Async Function Review
```bash
# List all async functions with complexity
fx ls --async --json | jq '.[] | {file, identifier, complexity: .metrics.cyclomaticComplexity}'

# Find async functions without proper error handling
fx ls --async --json | jq '.[] | select(.metrics.cyclomaticComplexity < 2) | "\(.file):\(.identifier) - possibly missing error handling"'
```

#### Dead Code Detection
```bash
# Find non-exported functions with low complexity
fx ls --json | jq '.[] | select(.exported == false and .metrics.cyclomaticComplexity == 1 and .metrics.linesOfCode < 5)'

# Identify potential utility functions
fx ls --json | jq '.[] | select(.metrics.parameterCount == 0 and .exported == false)'
```

### 7. Report Generation

#### Markdown Report
```bash
# Generate quality report
cat << 'EOF' > quality-report.md
# Code Quality Report

## Summary
$(fx m)

## High Complexity Functions
$(fx ls --json | jq -r '.[] | select(.metrics.cyclomaticComplexity > 10) | "- \(.file):\(.identifier) (CC: \(.metrics.cyclomaticComplexity))"')

## Recent Trends
$(fx metrics trends | head -20)
EOF
```

#### CSV Export
```bash
# Export metrics to CSV
echo "File,Function,CC,COG,LOC,Nesting,Params" > metrics.csv
fx ls --json | jq -r '.[] | [.file, .identifier, .metrics.cyclomaticComplexity, .metrics.cognitiveComplexity, .metrics.linesOfCode, .metrics.nestingDepth, .metrics.parameterCount] | @csv' >> metrics.csv
```

### 8. Integration Examples

#### Pre-commit Hook
```bash
#!/bin/bash
# Check for complexity violations before commit
violations=$(fx ls --json | jq '[.[] | select(.metrics.cyclomaticComplexity > 15)] | length')
if [ "$violations" -gt 0 ]; then
  echo "Found $violations functions with high complexity"
  fx ls --json | jq '.[] | select(.metrics.cyclomaticComplexity > 15) | "\(.file):\(.identifier)"'
  exit 1
fi
```

#### CI/CD Integration
```yaml
- name: Code Quality Check
  run: |
    fx metrics collect --root ./src
    fx metrics trends | grep -q "VIOLATION" && exit 1 || exit 0
```

### 9. Best Practices

1. **Regular Monitoring**: Run quality checks weekly
2. **Set Team Standards**: Define threshold values
3. **Track Trends**: Monitor metrics over time
4. **Focus on Hotspots**: Prioritize frequently modified complex code
5. **Document Exceptions**: Some complex functions are necessarily complex

## Quick Reference Card

| Task | Command |
|------|---------|
| Quick overview | `fx m` |
| Complexity check | `fx ls --json \| jq '.[] \| select(.metrics.cyclomaticComplexity > 10)'` |
| Trend analysis | `fx metrics trends` |
| Function history | `fx metrics show "file:function"` |
| PR metrics | `fx metrics pr 123` |
| Export CSV | `fx ls --json \| jq -r '.[] \| [.file, .metrics.cyclomaticComplexity] \| @csv'` |