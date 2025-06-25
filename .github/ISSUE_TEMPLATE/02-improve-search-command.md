---
name: Improve search command for better function discovery
about: Remove 10-item limit and enhance search functionality
title: "Improve search command for better function discovery"
labels: enhancement, search, ai-optimization
assignees: ''
---

## 🎯 Issue Summary

Improve the existing `search` command by removing the restrictive 10-item default limit and enhancing search capabilities to better support AI assistants and developer workflows.

## 🚨 Problem Statement

**Current Issues**:
1. **10-item limit hides functions** - Many relevant functions are not shown
2. **Empty query doesn't work** - Cannot search for all functions with `""`
3. **No bulk display option** - No way to see more results easily
4. **Poor AI experience** - Limited results reduce AI effectiveness

**Real-world Impact**:
```bash
# Current behavior - only 10 results shown
$ function-indexer search "*"
Found 10 matching functions: (but 216 total exist)
```

## 🎯 Proposed Solution

### Enhanced Search Options
```bash
# Remove default limit or increase significantly
function-indexer search "query" --limit 100  # New default

# Add --all option for unlimited results
function-indexer search "query" --all

# Support empty query for all functions
function-indexer search "" --all

# Better pagination
function-indexer search "query" --offset 50 --limit 50
```

### Improved Search Algorithm
- **Relevance scoring improvements** - Better function matching
- **Performance optimization** - Handle large result sets efficiently
- **Smart truncation** - Intelligent display of large results

## 🔧 Implementation Details

### Files to Modify
- [ ] `src/cli.ts` - Update search command options
- [ ] `src/search.ts` - Enhance SearchService class
- [ ] `src/commands/search.ts` - If exists, or create new file

### Key Changes

#### 1. Default Limit Changes
```typescript
// Current
.option('-l, --limit <number>', 'limit number of results', '10')

// Proposed
.option('-l, --limit <number>', 'limit number of results', '100')
.option('--all', 'show all results (no limit)')
```

#### 2. Empty Query Support
```typescript
// Handle empty query as "show all"
if (query === '' || query === '*') {
  // Return all functions, respecting limit options
  return this.getAllFunctions(options);
}
```

#### 3. Performance Optimization
```typescript
// Implement streaming/pagination for large results
private displayResults(results: FunctionInfo[], options: SearchOptions) {
  if (results.length > 50 && !options.all) {
    console.log(`Showing first ${options.limit} of ${results.length} results`);
    console.log('Use --all to see all results or --limit <n> to adjust');
  }
  
  // Display logic...
}
```

## 📋 Acceptance Criteria

### Functional Requirements
- [ ] Default limit increased to 100 (from 10)
- [ ] `--all` option removes all limits
- [ ] Empty query `""` shows all functions when combined with `--all`
- [ ] Performance remains acceptable with 1000+ functions
- [ ] Pagination hints for large result sets
- [ ] Backward compatibility maintained

### User Experience
- [ ] Clear indication when results are truncated
- [ ] Helpful suggestions for viewing more results
- [ ] Consistent output formatting
- [ ] No breaking changes to existing usage

### Performance
- [ ] Search completes within 2 seconds for 1000+ functions
- [ ] Memory usage remains reasonable for large codebases
- [ ] Progressive loading for very large result sets

## 🤖 AI Benefits

Enhanced search will enable AI assistants to:

1. **Comprehensive function discovery** - See all relevant matches
2. **Better context understanding** - Full result sets provide complete picture
3. **Improved code generation** - More examples lead to better suggestions
4. **Enhanced refactoring** - Complete view of function usage patterns

### AI Usage Examples
```bash
# AI can now discover all functions in a domain
function-indexer search "validation" --all

# Get complete project overview
function-indexer search "" --all --format simple

# Find all async functions for error handling analysis
function-indexer search "async" --all
```

## 🔧 Technical Implementation

### SearchService Enhancements
```typescript
export class SearchService {
  search(options: SearchOptions): FunctionInfo[] {
    const { query, limit = 100, all = false } = options;
    
    // Handle empty/wildcard queries
    if (this.isGlobalQuery(query)) {
      return this.getAllFunctions({ ...options, limit: all ? undefined : limit });
    }
    
    // Enhanced search with better scoring
    const results = this.performSearch(query);
    
    // Apply limits and return
    return all ? results : results.slice(0, limit);
  }
  
  private isGlobalQuery(query: string): boolean {
    return query === '' || query === '*' || query === '**';
  }
}
```

### Output Improvements
```typescript
private displaySearchResults(results: FunctionInfo[], options: SearchOptions) {
  const { limit, all } = options;
  
  if (!all && results.length > limit) {
    console.log(chalk.yellow(`Showing ${limit} of ${results.length} results`));
    console.log(chalk.gray('Use --all to see all results'));
  }
  
  // Display results...
}
```

## 📚 Documentation Updates

- [ ] Update `docs/AI-GUIDE.md` with new search capabilities
- [ ] Add performance considerations to documentation
- [ ] Update command examples in README
- [ ] Document new options in CLI help

## 🧪 Testing Strategy

### Unit Tests
- [ ] Empty query handling
- [ ] Limit option variations
- [ ] Performance with large datasets
- [ ] Result ranking accuracy

### Integration Tests
- [ ] End-to-end search workflows
- [ ] AI assistant usage patterns
- [ ] Large codebase scenarios

## 🔗 Related Issues

- Issue #1: Add list command (complementary functionality)
- Issue #6: AI Assistant Master Guide (documentation)
- Issue #7: Command reference optimization

## 💡 Future Enhancements

- **Advanced search syntax** - Regular expressions, complex queries
- **Search history** - Recent searches with quick access
- **Search suggestions** - Auto-complete for function names
- **Faceted search** - Filter by file, complexity, type simultaneously