# PR Review Automation Template

## Purpose
Automate and enhance pull request reviews by analyzing code changes, metrics impact, and potential issues using Function Indexer.

## Basic Usage

### 1. PR Metrics Collection
```bash
# Collect metrics for a specific PR
fx metrics collect --pr 123

# View PR-specific metrics
fx metrics pr 123

# Compare with base branch
git checkout main
fx metrics collect --output base-metrics.json
git checkout feature-branch
fx metrics collect --output feature-metrics.json
```

### 2. Change Impact Analysis

#### Modified Functions Detection
```bash
# Get list of modified files
git diff main --name-only | grep -E '\.(ts|tsx|js|jsx)$' > modified-files.txt

# Extract functions from modified files
while read file; do
  fx ls --filter "$file" --json >> modified-functions.json
done < modified-files.txt

# Analyze complexity changes
jq -s 'flatten | group_by(.identifier) | map({identifier: .[0].identifier, count: length, avgComplexity: (map(.metrics.cyclomaticComplexity) | add/length)})' modified-functions.json
```

#### New Functions Analysis
```bash
# Find new functions
git diff main --name-only | xargs fx ls --json > current-functions.json
git checkout main && fx ls --json > base-functions.json && git checkout -
jq -s '.[0] - .[1]' current-functions.json base-functions.json > new-functions.json
```

### 3. Automated Review Checks

#### Complexity Violations
```bash
#!/bin/bash
# Check for complexity violations in PR

echo "## Complexity Analysis"
violations=$(fx ls --json | jq '[.[] | select(.metrics.cyclomaticComplexity > 10)] | length')
if [ "$violations" -gt 0 ]; then
  echo "⚠️ Found $violations functions with high complexity:"
  fx ls --json | jq -r '.[] | select(.metrics.cyclomaticComplexity > 10) | "- \(.file):\(.identifier) (CC: \(.metrics.cyclomaticComplexity))"'
else
  echo "✅ No complexity violations found"
fi
```

#### Type Safety Check
```bash
# Check for missing return types in new/modified functions
echo "## Type Safety Analysis"
missing_types=$(cat modified-functions.json | jq '[.[] | select(.metrics.hasReturnType == false and .exported == true)] | length')
if [ "$missing_types" -gt 0 ]; then
  echo "⚠️ Found $missing_types exported functions without return types:"
  cat modified-functions.json | jq -r '.[] | select(.metrics.hasReturnType == false and .exported == true) | "- \(.file):\(.identifier)"'
fi
```

### 4. AI-Optimized PR Review Workflow

#### Comprehensive PR Analysis Script
```bash
#!/bin/bash
# pr-review.sh - Comprehensive PR analysis

PR_NUMBER=$1
echo "# PR #$PR_NUMBER Review Analysis"
echo "Generated: $(date)"
echo

# 1. Collect PR metrics
echo "## Metrics Collection"
fx metrics collect --pr $PR_NUMBER
echo

# 2. Show PR metrics summary
echo "## PR Metrics Summary"
fx metrics pr $PR_NUMBER
echo

# 3. Identify modified functions
echo "## Modified Functions"
git diff main --name-only | grep -E '\.(ts|tsx)$' | while read file; do
  if [ -f "$file" ]; then
    fx ls --filter "$file" --json | jq -r '.[] | "- \(.file):\(.identifier) (CC: \(.metrics.cyclomaticComplexity), LOC: \(.metrics.linesOfCode))"'
  fi
done
echo

# 4. Check for violations
echo "## Quality Gates"
fx ls --json | jq -r '
  .[] | 
  select(.metrics.cyclomaticComplexity > 10 or 
         .metrics.cognitiveComplexity > 15 or 
         .metrics.linesOfCode > 40 or 
         .metrics.nestingDepth > 3) |
  "❌ \(.file):\(.identifier) - " +
  (if .metrics.cyclomaticComplexity > 10 then "CC:\(.metrics.cyclomaticComplexity) " else "" end) +
  (if .metrics.cognitiveComplexity > 15 then "COG:\(.metrics.cognitiveComplexity) " else "" end) +
  (if .metrics.linesOfCode > 40 then "LOC:\(.metrics.linesOfCode) " else "" end) +
  (if .metrics.nestingDepth > 3 then "Nesting:\(.metrics.nestingDepth)" else "" end)
'

# 5. Test coverage reminder
echo
echo "## Test Coverage"
echo "⚠️ Remember to check test coverage for modified functions"
git diff main --name-only | grep -E 'test|spec' | wc -l | xargs -I {} echo "📊 Test files modified: {}"
```

### 5. GitHub Actions Integration

#### PR Review Workflow
```yaml
name: PR Review Analysis
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Function Indexer
        run: npm install -g function-indexer
      
      - name: Run PR Analysis
        run: |
          fx metrics collect --pr ${{ github.event.pull_request.number }}
          fx metrics pr ${{ github.event.pull_request.number }} > pr-metrics.txt
      
      - name: Check Quality Gates
        run: |
          violations=$(fx ls --json | jq '[.[] | select(.metrics.cyclomaticComplexity > 15)] | length')
          if [ "$violations" -gt 0 ]; then
            echo "::error::Found $violations functions exceeding complexity threshold"
            fx ls --json | jq -r '.[] | select(.metrics.cyclomaticComplexity > 15) | "::error file=\(.file),line=\(.startLine)::Function \(.identifier) has cyclomatic complexity of \(.metrics.cyclomaticComplexity)"'
            exit 1
          fi
      
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const metrics = fs.readFileSync('pr-metrics.txt', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Function Indexer Analysis\n\n${metrics}`
            });
```

### 6. Review Comment Generation

#### Automated Suggestions
```bash
# Generate review suggestions based on metrics
fx ls --json | jq -r '
  .[] |
  select(.metrics.cyclomaticComplexity > 10) |
  "**File:** `\(.file)`\n**Function:** `\(.identifier)`\n**Suggestion:** Consider refactoring this function (CC: \(.metrics.cyclomaticComplexity)). High cyclomatic complexity makes the code harder to test and maintain.\n"
'
```

#### Positive Feedback
```bash
# Highlight improvements
echo "## Improvements Found 🎉"
fx ls --json | jq -r '
  .[] |
  select(.metrics.cyclomaticComplexity <= 5 and .metrics.hasReturnType == true and .exported == true) |
  "✅ Well-structured function: `\(.identifier)` in \(.file)"
' | head -5
```

### 7. Comparison Reports

#### Before/After Metrics
```bash
# Generate comparison report
cat << 'EOF' > compare-metrics.sh
#!/bin/bash
# Compare metrics between branches

# Checkout and analyze base branch
git checkout main
fx --output base-index.jsonl
fx ls --json > base-metrics.json

# Checkout and analyze feature branch
git checkout -
fx --output feature-index.jsonl
fx ls --json > feature-metrics.json

# Generate comparison
echo "## Metrics Comparison"
echo "| Metric | Base | Feature | Change |"
echo "|--------|------|---------|--------|"

# Count functions
base_count=$(jq length base-metrics.json)
feature_count=$(jq length feature-metrics.json)
echo "| Total Functions | $base_count | $feature_count | $((feature_count - base_count)) |"

# Average complexity
base_avg_cc=$(jq '[.[] | .metrics.cyclomaticComplexity] | add/length' base-metrics.json)
feature_avg_cc=$(jq '[.[] | .metrics.cyclomaticComplexity] | add/length' feature-metrics.json)
echo "| Avg Complexity | $base_avg_cc | $feature_avg_cc | $(echo "$feature_avg_cc - $base_avg_cc" | bc) |"
EOF

chmod +x compare-metrics.sh
./compare-metrics.sh
```

### 8. Best Practices

1. **Automate Early**: Set up PR checks in CI/CD pipeline
2. **Focus on Changes**: Analyze only modified functions
3. **Set Thresholds**: Define team-specific quality gates
4. **Provide Context**: Include explanations with violations
5. **Track Trends**: Monitor metrics across PRs

### 9. Review Checklist Generator

```bash
# Generate PR review checklist
cat << 'EOF' > pr-checklist.md
## PR Review Checklist

### Code Quality
$(fx ls --json | jq -r 'map(select(.metrics.cyclomaticComplexity > 10)) | if length > 0 then "- [ ] Address high complexity functions (" + (length | tostring) + " found)" else "- [x] No high complexity functions" end')
$(fx ls --exported --json | jq -r 'map(select(.metrics.hasReturnType == false)) | if length > 0 then "- [ ] Add return types to exported functions (" + (length | tostring) + " missing)" else "- [x] All exported functions have return types" end')

### Metrics
- [ ] Run `fx metrics collect --pr $(git rev-parse --abbrev-ref HEAD | sed 's/.*\///')`
- [ ] Review metrics trends: `fx metrics trends`
- [ ] Check for new violations

### Tests
- [ ] Verify test coverage for new functions
- [ ] Ensure complex functions have corresponding tests
EOF
```

## Quick Reference Card

| Task | Command |
|------|---------|
| PR metrics | `fx metrics collect --pr 123` |
| View PR analysis | `fx metrics pr 123` |
| List modified functions | `git diff main --name-only \| xargs fx ls` |
| Check violations | `fx ls --json \| jq '.[] \| select(.metrics.cyclomaticComplexity > 10)'` |
| Generate report | `./pr-review.sh 123 > review.md` |
| Compare branches | `./compare-metrics.sh` |