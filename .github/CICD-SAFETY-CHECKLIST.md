# CI/CD Safety Checklist

## 🚨 MANDATORY: Before Making ANY Configuration Changes

### Pre-Change Verification
- [ ] **Impact Analysis**: List ALL files and systems affected
- [ ] **Rollback Plan**: Document exact steps to revert changes
- [ ] **Test in Isolation**: Create a test branch first
- [ ] **Review Dependencies**: Check if change affects build/runtime

### Critical Configuration Files (HIGH RISK)
These files can break CI/CD if modified incorrectly:
- `package.json` - Especially: `type`, `main`, `scripts`, `engines`
- `tsconfig.json` - Especially: `module`, `target`, `moduleResolution`
- `.github/workflows/*.yml` - Any CI/CD configuration
- Build configuration files (webpack, rollup, etc.)

### Safe Change Process

#### 1. For ESLint/Linting Tools
```bash
# ❌ NEVER DO THIS
# Add "type": "module" to package.json for ESLint

# ✅ ALWAYS DO THIS
# Use .cjs extension for CommonJS projects
mv eslint.config.js eslint.config.cjs
# Or use .mjs for ESM-only config files
mv eslint.config.js eslint.config.mjs
```

#### 2. For Package.json Changes
```bash
# Before ANY package.json change:
1. Create backup: cp package.json package.json.backup
2. Test locally: npm install && npm run build && npm test
3. Test in CI: Push to feature branch first
4. Monitor CI results before merging
```

#### 3. For TypeScript Config Changes
```bash
# Critical alignment check:
# If package.json has no "type" or "type": "commonjs"
# Then tsconfig.json MUST have "module": "commonjs"
# 
# If package.json has "type": "module"  
# Then tsconfig.json MUST have "module": "ES2020" or similar
# AND all imports need .js extensions
```

### Testing Protocol

#### Local Testing (MANDATORY)
```bash
# Run this sequence BEFORE pushing:
npm install          # Verify dependencies
npm run build        # Verify compilation
npm test            # Verify tests
node dist/cli.js --version  # Verify runtime
```

#### CI Testing Strategy
1. **Feature Branch First**: Never push config changes directly to main
2. **Wait for CI**: Let all CI checks complete on feature branch
3. **Review Logs**: Check CI logs for warnings, not just pass/fail
4. **Gradual Rollout**: Merge during low-activity periods

### Common Pitfalls That Break CI/CD

#### 1. Module System Mismatch
**Problem**: ESM/CommonJS confusion
**Impact**: Runtime errors, build failures
**Prevention**: Keep module system consistent across all configs

#### 2. Dependency Version Conflicts  
**Problem**: Incompatible package versions
**Impact**: Install failures, runtime errors
**Prevention**: Use exact versions, test updates individually

#### 3. Node Version Requirements
**Problem**: Using features not available in CI Node version
**Impact**: Syntax errors, API not found
**Prevention**: Check .github/workflows for Node version

### Emergency Response Plan

If CI/CD breaks despite precautions:

1. **Immediate Rollback**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Communicate**
   - Notify team immediately
   - Create incident report issue
   - Document timeline and impact

3. **Root Cause Analysis**
   - What changed?
   - Why wasn't it caught in testing?
   - How to prevent recurrence?

### Decision Framework

Before making ANY configuration change, ask:

1. **Is this change necessary?**
   - Can the goal be achieved differently?
   - Is there a less risky approach?

2. **What's the blast radius?**
   - Local development only?
   - CI/CD pipeline?
   - Production deployments?

3. **Can it be tested safely?**
   - Feature branch available?
   - Local testing sufficient?
   - Staging environment needed?

4. **Is the timing right?**
   - Active PRs that might conflict?
   - Upcoming releases?
   - Team availability for support?

### Configuration Change Risk Matrix

| Change Type | Risk Level | Required Testing | Approval Needed |
|------------|------------|------------------|-----------------|
| ESLint config | Low | Local only | Self |
| package.json scripts | Medium | Local + CI branch | Self |
| package.json type/main | HIGH | Full CI + manual test | Team review |
| tsconfig.json module | HIGH | Full CI + runtime test | Team review |
| Node version | CRITICAL | Full regression suite | Team consensus |
| Build tool config | HIGH | Full CI + deploy test | Team review |

### Lessons from Past Incidents

#### Incident: ESM Module Type Addition (2025-06-27)
- **What happened**: Added `"type": "module"` for ESLint
- **Impact**: CI/CD pipeline failed, blocking all PRs
- **Root cause**: Module system mismatch between configs
- **Prevention**: Use .cjs/.mjs extensions instead of changing project type

---

**Remember**: It's better to find a workaround than to risk breaking CI/CD.
When in doubt, ask for review or test in isolation first.