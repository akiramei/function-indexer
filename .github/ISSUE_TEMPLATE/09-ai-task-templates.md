---
name: Add AI task templates for common use cases
about: Create ready-to-use templates for common AI assistant workflows
title: "Add AI task templates for common use cases"
labels: documentation, templates, ai-optimization
assignees: ''
---

## 🤖 Issue Summary

Create a collection of ready-to-use task templates that enable AI assistants to quickly implement common Function Indexer workflows without needing to construct commands from scratch.

## 🚨 Problem Statement

**Current Issues**:
1. **No standardized workflows** - AI assistants create ad-hoc patterns
2. **Inconsistent usage** - Different AIs use different approaches for same tasks
3. **Missed opportunities** - AI doesn't know about advanced features or optimal patterns
4. **Reinventing patterns** - Each AI interaction starts from scratch
5. **Suboptimal combinations** - AI doesn't know best command sequences

**Real-world Impact**:
- AI assistants provide inconsistent guidance
- Users get suboptimal workflows
- Advanced features remain underutilized
- Repeated questions about basic workflows

## 🎯 Proposed Solution

### Task Template Collection
Create `docs/templates/` directory with ready-to-use templates for common AI assistant tasks:

1. **Function Discovery Templates** - Finding and understanding functions
2. **Code Quality Templates** - Assessing and improving code quality
3. **Project Analysis Templates** - Understanding codebase structure
4. **Development Workflow Templates** - Integrating with development processes

### Template Structure
Each template includes:
- **Goal description** - What the template accomplishes
- **Step-by-step commands** - Exact commands to run
- **Expected outputs** - What to expect from each step
- **Processing examples** - How to parse and use the output
- **Common variations** - Alternative approaches for different scenarios

## 🔧 Implementation Details

### Template Directory Structure
```
docs/templates/
├── README.md                      # Template index and usage guide
├── function-discovery/
│   ├── find-all-functions.md      # Get complete function overview
│   ├── find-by-functionality.md   # Search for specific features
│   ├── find-exported-api.md       # Discover public API
│   └── find-complex-functions.md  # Identify refactoring candidates
├── code-quality/
│   ├── quality-assessment.md      # Overall quality analysis
│   ├── complexity-analysis.md     # Find high-complexity functions
│   ├── pr-quality-check.md        # PR-focused quality review
│   └── trend-analysis.md          # Quality trends over time
├── project-analysis/
│   ├── codebase-overview.md       # Complete project understanding
│   ├── architecture-analysis.md   # Understand project structure
│   ├── dependency-mapping.md      # Function relationships
│   └── migration-planning.md      # Refactoring preparation
└── development-workflow/
    ├── ci-integration.md          # Continuous integration setup
    ├── pre-commit-hooks.md        # Git hook integration
    ├── code-review-prep.md        # Prepare for code review
    └── documentation-sync.md      # Keep docs in sync
```

### Template Format Example

#### Template: Find All Functions
```markdown
# Template: Complete Function Discovery

## 🎯 Goal
Get a comprehensive overview of all functions in a project for analysis, documentation, or refactoring planning.

## 📋 Prerequisites
- Project contains TypeScript/TSX files
- Function Indexer is available (npx or local install)

## 🔄 Step-by-Step Workflow

### Step 1: Generate Function Index
```bash
npx @akiramei/function-indexer
```

**Expected Output:**
```
✅ Indexing completed!
📁 Files processed: 45
🔧 Functions found: 216
⏱️ Execution time: 1.2s
```

**What This Does:** Creates `function-index.jsonl` with all function metadata

### Step 2: List All Functions (Simple Format)
```bash
npx @akiramei/function-indexer list --format simple
```

**Expected Output:**
```
src/auth/login.ts:15:validateCredentials
src/auth/login.ts:32:hashPassword
src/api/users.ts:20:createUser
src/api/users.ts:45:updateUser
...
```

**What This Does:** Provides AI-friendly list of all functions

### Step 3: Get Detailed Function Information
```bash
npx @akiramei/function-indexer list --format json > functions.json
```

**Expected Output:** JSON array with complete function metadata

## 🤖 AI Processing Examples

### Parse Simple Format (Python)
```python
def parse_function_list(output: str) -> List[Dict]:
    functions = []
    for line in output.strip().split('\n'):
        if ':' in line:
            parts = line.split(':')
            if len(parts) >= 3:
                file = parts[0]
                line_num = int(parts[1])
                func_name = ':'.join(parts[2:])
                functions.append({
                    'file': file,
                    'line': line_num,
                    'name': func_name
                })
    return functions
```

### Parse JSON Format (JavaScript)
```javascript
async function analyzeFunctions(jsonFile) {
    const functions = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    
    // Group by file
    const byFile = functions.reduce((acc, func) => {
        acc[func.file] = acc[func.file] || [];
        acc[func.file].push(func);
        return acc;
    }, {});
    
    // Find exported functions
    const exported = functions.filter(f => f.exported);
    
    // Find complex functions
    const complex = functions.filter(f => 
        f.metrics.cyclomaticComplexity > 10
    );
    
    return { byFile, exported, complex };
}
```

## 🎯 Common Variations

### For Large Codebases
```bash
# Filter by directory
npx @akiramei/function-indexer list --file "src/components/**"

# Show only exported functions
npx @akiramei/function-indexer list --exported
```

### For API Analysis
```bash
# Find all async functions (likely API endpoints)
npx @akiramei/function-indexer list --async --exported
```

### For Refactoring
```bash
# Get functions with quality metrics
npx @akiramei/function-indexer list --format json | jq '.[] | select(.metrics.cyclomaticComplexity > 10)'
```

## ✅ Success Criteria
- [ ] Complete function inventory obtained
- [ ] Functions grouped by file/module
- [ ] Exported API identified
- [ ] Complex functions flagged for attention

## 🔄 Next Steps
- Use with quality assessment template
- Combine with architecture analysis
- Feed into documentation generation
```

## 📋 Acceptance Criteria

### Template Coverage
- [ ] All major use cases covered with dedicated templates
- [ ] Templates include step-by-step instructions
- [ ] Code examples provided in multiple languages
- [ ] Common variations documented for each template
- [ ] Success criteria defined for each workflow

### Template Quality
- [ ] All commands are tested and work correctly
- [ ] Expected outputs match actual results
- [ ] Processing examples are functional
- [ ] Templates are beginner-friendly
- [ ] Advanced options are documented

### AI Optimization
- [ ] Templates are optimized for AI consumption
- [ ] Copy-paste ready command sequences
- [ ] Clear goal statements for each template
- [ ] Machine-readable structure where possible
- [ ] Integration points clearly marked

## 🤖 AI Benefits

### Immediate Productivity
AI assistants will be able to:
1. **Start working immediately** with proven workflows
2. **Provide consistent guidance** across different interactions
3. **Use advanced features** through template examples
4. **Avoid common mistakes** with tested patterns

### Better Integration
1. **Standardized workflows** across different AI implementations
2. **Optimal command usage** with best practices built-in
3. **Feature discovery** through template exploration
4. **Scalable patterns** that work for different project sizes

## 🔧 Implementation Plan

### Phase 1: Core Templates
- [ ] Function discovery templates (4 templates)
- [ ] Basic code quality templates (2 templates)
- [ ] Project overview template (1 template)

### Phase 2: Advanced Workflows
- [ ] Complete code quality suite (4 templates)
- [ ] Project analysis templates (4 templates)
- [ ] Development workflow templates (4 templates)

### Phase 3: Optimization & Testing
- [ ] Test all templates with real projects
- [ ] Optimize for AI consumption
- [ ] Add processing examples in multiple languages
- [ ] Create template index and navigation

### Phase 4: Integration
- [ ] Link templates from main documentation
- [ ] Create quick-start guide using templates
- [ ] Add template discovery to CLI
- [ ] Integrate with AI Assistant Master Guide

## 📚 Template Categories Detail

### 🔍 Function Discovery Templates

#### 1. Find All Functions
**Goal**: Complete function inventory
**Use Cases**: Documentation, refactoring planning, codebase understanding

#### 2. Find by Functionality  
**Goal**: Locate functions for specific features
**Use Cases**: Feature development, bug fixing, code review

#### 3. Find Exported API
**Goal**: Understand public interface
**Use Cases**: API documentation, integration planning

#### 4. Find Complex Functions
**Goal**: Identify refactoring candidates
**Use Cases**: Code quality improvement, technical debt reduction

### 📊 Code Quality Templates

#### 1. Quality Assessment
**Goal**: Overall code health evaluation
**Use Cases**: Project assessment, quality gates

#### 2. Complexity Analysis
**Goal**: Deep complexity evaluation
**Use Cases**: Refactoring prioritization, risk assessment

#### 3. PR Quality Check
**Goal**: Review-focused quality analysis
**Use Cases**: Code review preparation, CI integration

#### 4. Trend Analysis
**Goal**: Quality evolution tracking
**Use Cases**: Long-term quality management, team metrics

## 🧪 Testing Strategy

### Template Validation
- [ ] Execute all commands in templates
- [ ] Verify outputs match examples
- [ ] Test with different project sizes
- [ ] Validate processing examples

### AI Assistant Testing
- [ ] Test templates with different AI assistants
- [ ] Verify workflow completion
- [ ] Check result quality and consistency
- [ ] Validate learning transfer

### Real-world Testing
- [ ] Use templates with actual projects
- [ ] Gather feedback from template usage
- [ ] Iterate based on practical experience
- [ ] Optimize for common edge cases

## 🔗 Related Issues

This template collection supports:
- Issue #1-3: Core functionality (provide usage examples)
- Issue #4-5: Metrics features (quality-focused templates)
- Issue #6: AI Assistant Master Guide (practical examples)
- Issue #7: Command reference (real-world usage patterns)

## 💡 Future Enhancements

### Interactive Templates
- [ ] CLI-based template selection
- [ ] Interactive parameter input
- [ ] Template customization wizard
- [ ] Progress tracking for multi-step workflows

### Advanced Templates
- [ ] Multi-project templates (monorepos)
- [ ] Language-specific templates
- [ ] Framework-specific workflows
- [ ] Custom template creation guide

### Integration Features
- [ ] IDE plugin integration
- [ ] CI/CD template automation
- [ ] Template sharing platform
- [ ] Community template contributions

## 📊 Success Metrics

### Adoption Metrics
- Template usage frequency
- Workflow completion rates
- Error reduction in AI guidance
- User satisfaction with provided workflows

### Quality Metrics
- Consistency of AI assistant guidance
- Reduction in support questions
- Improvement in Function Indexer usage patterns
- Feature discovery and utilization rates