# Team Features Guide

> 🚀 Collaborate on code quality with your team using Function Indexer's team features

## Overview

Function Indexer v1.1 introduces powerful team collaboration features designed to help development teams maintain code quality standards across their projects. These features integrate seamlessly with your existing Git workflow and CI/CD pipelines.

## Table of Contents

- [Git Diff Command](#git-diff-command)
- [Report Generation](#report-generation)
- [CI/CD Integration](#cicd-integration)
- [Workflow Examples](#workflow-examples)
- [Best Practices](#best-practices)

## Git Diff Command

Compare functions between branches or commits to understand how code complexity changes over time.

### Basic Usage

```bash
# Compare current branch with main
npx github:akiramei/function-indexer diff main

# Compare two branches
npx github:akiramei/function-indexer diff main..feature/new-auth

# Compare specific commits
npx github:akiramei/function-indexer diff abc123..def456
```

### Options

- `-f, --format <format>` - Output format: `terminal` (default), `markdown`, `json`
- `-o, --output <file>` - Save output to file
- `--thresholds <json>` - Custom complexity thresholds

### Example Output

```console
Function Changes: main..feature-auth

Added (3):
  ✅ src/auth/validateToken.ts:15 - validateToken()
  ✅ src/auth/refreshToken.ts:8 - refreshToken()
  ⚠️ src/utils/jwt.ts:22 - decodeJWT()
     Complexity: 12 (exceeded threshold)

Modified (2):
  ⚠️ src/auth/login.ts:45 - authenticateUser() 
     Cyclomatic complexity: 8 → 12 (exceeded threshold)
  ✅ src/auth/logout.ts:12 - logoutUser()

Removed (1):
  ❌ src/auth/legacy.ts:30 - oldAuthMethod()
```

## Report Generation

Generate comprehensive code quality reports in various formats.

### Basic Usage

```bash
# Generate markdown report (default)
npx github:akiramei/function-indexer report

# Generate HTML report
npx github:akiramei/function-indexer report --format html --output report.html

# Use custom template
npx github:akiramei/function-indexer report --template ./my-template.hbs
```

### Report Contents

Reports include:
- **Summary Statistics** - Total functions, complexity distribution
- **Top Issues** - Functions exceeding thresholds
- **Metrics Breakdown** - Per-file analysis
- **Recommendations** - Actionable improvements

### Custom Templates

Create custom Handlebars templates for your reports:

```handlebars
# {{title}}

Generated: {{generatedAt}}

## Overview
- Functions: {{summary.totalFunctions}}
- High Complexity: {{summary.highComplexity}}

{{#each violations}}
### {{this.identifier}}
File: {{this.file}}:{{this.startLine}}
Issues:
{{#each this.issues}}
- {{this}}
{{/each}}
{{/each}}
```

## CI/CD Integration

The `ci` command provides a streamlined experience for continuous integration pipelines.

### Basic Usage

```bash
# Run CI analysis
npx github:akiramei/function-indexer ci

# Generate PR comment
npx github:akiramei/function-indexer ci --comment --base origin/main

# Custom format for your CI system
npx github:akiramei/function-indexer ci --format github  # or gitlab, json
```

### Exit Codes

- `0` - All quality checks passed
- `1` - Quality violations found (when using `--fail-on-violation`)

### Environment Detection

Function Indexer automatically detects these CI environments:
- GitHub Actions
- GitLab CI
- CircleCI
- Jenkins
- Generic CI (via `CI` environment variable)

## Workflow Examples

### GitHub Actions

```yaml
name: Code Quality Check
on: [pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: sudo apt-get update && sudo apt-get install -y build-essential python3-dev
      - run: npx github:akiramei/function-indexer ci --format github --comment
```

### GitLab CI

```yaml
code-quality:
  stage: test
  script:
    - apt-get update && apt-get install -y build-essential python3-dev
    - npx github:akiramei/function-indexer ci --format gitlab --output code-quality.json
  artifacts:
    reports:
      codequality: code-quality.json
```

### Pre-commit Hook

```bash
#!/bin/sh
# .husky/pre-commit

# Check code quality before commit
npx github:akiramei/function-indexer ci --fail-on-violation || {
  echo "❌ Code quality check failed!"
  echo "Run 'npx github:akiramei/function-indexer metrics --details' to see issues"
  exit 1
}
```

### Weekly Reports

Set up automated weekly reports:

```yaml
# GitHub Actions example
name: Weekly Report
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          sudo apt-get update && sudo apt-get install -y build-essential python3-dev
          npx github:akiramei/function-indexer
          npx github:akiramei/function-indexer report --output weekly-report.md
      - uses: actions/create-issue@v2
        with:
          title: Weekly Code Quality Report
          body-file: weekly-report.md
```

## Best Practices

### 1. Set Team Thresholds

Create a shared configuration in `.function-indexer/config.json`:

```json
{
  "metrics": {
    "thresholds": {
      "cyclomaticComplexity": 10,
      "cognitiveComplexity": 15,
      "linesOfCode": 40,
      "nestingDepth": 3,
      "parameterCount": 4
    }
  }
}
```

### 2. Progressive Enhancement

Start with warnings, then enforce:

```bash
# Phase 1: Warning only
npx github:akiramei/function-indexer ci --no-fail-on-violation

# Phase 2: Enforce standards
npx github:akiramei/function-indexer ci --fail-on-violation
```

### 3. Focus on Trends

Use diff to track improvement:

```bash
# Check if PR improves code quality
npx github:akiramei/function-indexer diff $BASE_BRANCH..$HEAD_BRANCH

# Track metrics over time
npx github:akiramei/function-indexer collect-metrics --pr $PR_NUMBER
npx github:akiramei/function-indexer analyze-trends
```

### 4. Integrate with Code Reviews

Add to PR template:

```markdown
## Code Quality Checklist
- [ ] Run `npx github:akiramei/function-indexer diff main` - no new violations
- [ ] Complex functions documented
- [ ] Metrics within team thresholds
```

### 5. Automate Everything

- **PRs**: Automatic comments with violations
- **Main branch**: Track metrics history
- **Weekly**: Generate and share reports
- **Pre-commit**: Catch issues early

## Troubleshooting

### Common Issues

**Q: Diff shows everything as "added"**
- Ensure you've fetched all branches: `git fetch --all`
- Check base branch exists: `git branch -r`

**Q: CI command fails in pipeline**
- Verify Node.js version (requires 16+)
- Check Git is available in CI environment
- Ensure full clone (not shallow) for diffs

**Q: Reports are empty**
- Run `npx github:akiramei/function-indexer` first to generate index
- Check `.function-indexer/index.jsonl` exists
- Verify file patterns in config

### Getting Help

- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Open an issue on [GitHub](https://github.com/akiramei/function-indexer/issues)
- See [examples/](../examples/) for working configurations