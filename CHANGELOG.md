# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-01-15

### Added

#### Team Collaboration Features
- **`diff` command** - Compare functions between Git branches/commits
  - Shows added, modified, and removed functions
  - Highlights complexity threshold violations
  - Supports multiple output formats (terminal, markdown, JSON)
  
- **`report` command** - Generate comprehensive code quality reports
  - Markdown and HTML format support
  - Customizable Handlebars templates
  - Includes metrics distribution, top issues, and recommendations
  
- **`ci` command** - Streamlined CI/CD integration
  - Automatic CI environment detection
  - Exit codes based on quality gates
  - PR comment generation
  - Format-specific output for GitHub Actions, GitLab CI, etc.

#### CI/CD Examples
- GitHub Actions workflows for PR analysis and weekly reports
- GitLab CI configuration with Code Quality integration
- CircleCI and Jenkins pipeline examples
- Pre-commit hook examples

#### Dependencies
- Added `simple-git` for Git operations
- Added `handlebars` for report templating

### Changed
- Updated README with new team features documentation
- Enhanced help text to include new commands
- Improved CLI structure with modular command organization

### Fixed
- Type compatibility issues with metrics interfaces
- Template path resolution for report generation

## [1.0.0] - 2024-01-01

### Added
- Zero-config operation with smart defaults
- Project auto-detection (TypeScript/TSX)
- Function search with natural language
- Code metrics tracking (complexity, LOC, etc.)
- Incremental index updates
- Metrics history with SQLite storage
- Multiple domain support
- AI description generation (optional)

### Changed
- Simplified CLI with automatic initialization
- Moved from manual configuration to convention-based setup
- Improved error messages and user guidance

### Deprecated
- Manual `--root` and `--output` flags (now automatic, but still supported)

## [0.9.0] - 2023-12-15

### Added
- Initial release with basic function indexing
- JSONL output format
- TypeScript AST parsing with ts-morph
- Basic metrics calculation
- Search functionality