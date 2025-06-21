# Diff Output Example

This is an example of the `function-indexer diff` command output in markdown format.

## Function Changes Summary

- **Added**: 3 functions
- **Modified**: 2 functions
- **Removed**: 1 function

### Added Functions

- ✅ `src/auth/validateToken.ts:15` - `validateToken()`
- ✅ `src/auth/refreshToken.ts:8` - `refreshToken()`
- ⚠️ `src/utils/jwt.ts:22` - `decodeJWT()`
  - Cyclomatic complexity: 12 (threshold: 10)

### Modified Functions

- ⚠️ `src/auth/login.ts:45` - `authenticateUser()`
  - Changes:
    - Cyclomatic complexity: 8 → 12 (+4)
    - Lines of code: 25 → 35 (+10)
- ✅ `src/auth/logout.ts:12` - `logoutUser()`
  - Changes:
    - Lines of code: 15 → 12 (-3)

### Removed Functions

- ❌ `src/auth/legacy.ts:30` - `oldAuthMethod()`