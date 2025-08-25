# weekly-git-summary Copilot Instructions

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Environment Setup and Dependencies

- Install Node.js ≥22.0.0: `curl -fsSL https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.xz -o node.tar.xz && tar -xf node.tar.xz && sudo cp -r node-v22.14.0-linux-x64/* /usr/local/`
- Install Bun runtime: `curl -fsSL https://bun.sh/install | bash && source ~/.bashrc && export PATH="$HOME/.bun/bin:$PATH"`
- Install dependencies: `bun install` (preferred) or `npm install` (fallback if network issues)
- Verify setup: `node --version && bun --version`

### Build Process

- Build the CLI tool: `bun run build.ts` or `bun run build`
- Build time: ~5 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
- Output: Creates `build/cli.js` (main entry), `build/weekly-git-summary.js`, platform scripts, and HTML template
- Verify build: `ls -la build/` should show: cli.js, weekly-git-summary.js, weekly-git-summary.sh, weekly-git-summary.ps1, git-log.html

### Testing

- Run all tests: `bun test`
- Test time: ~4 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
- Expected: 40 tests pass, 0 fail
- Run specific test suites:
  - CLI tests: `bun test tests/cli.test.ts`
  - Build tests: `bun test tests/build.test.ts`
  - Integration tests: `bun test tests/integration.test.ts`
  - Windows tests: `bun test tests/windows.test.ts`

### Linting and Code Quality

- Run linting: `npm run lint`
- Fix linting issues: `npm run lint:fix`
- Lint time: ~2 seconds. NEVER CANCEL.
- TypeScript check: `bun tsc --noEmit`

## CLI Tool Usage and Validation

### Basic CLI Testing

- Show help: `node build/cli.js --help`
- Test JSON output: `node build/cli.js --dir . --since 2024-01-01 --json`
- Test Markdown output: `node build/cli.js --dir . --since 2024-01-01 --md`
- Test HTML output: `node build/cli.js --dir . --since 2024-01-01 --html`
- CLI execution time: <2 seconds per command. NEVER CANCEL.

### Validation Scenarios

**CRITICAL**: After making any changes to the CLI functionality, ALWAYS test these complete scenarios:

1. **JSON Output Validation**:

   ```bash
   node build/cli.js --dir . --since 2024-01-01 --json > test-output.json
   ```

   - Verify valid JSON structure with `timeRange`, `repositories` fields
   - Check commit data includes `message`, `author`, `hash` fields

2. **Markdown Report Generation**:

   ```bash
   node build/cli.js --dir . --since 2024-01-01 --md > weekly-report.md
   ```

   - Verify Markdown headers, commit listings, author information
   - Check date formatting and repository structure

3. **HTML Dashboard Testing**:

   ```bash
   node build/cli.js --dir . --since 2024-01-01 --html > git-dashboard.html
   ```

   - Verify HTML output contains complete dashboard with CSS/JS
   - Check for echarts integration, responsive design, dark mode toggle

4. **Author Filtering**:

   ```bash
   node build/cli.js --dir . --author "Test User" --json
   ```

   - Verify filtering works with quoted author names containing spaces

5. **Date Range Testing**:

   ```bash
   node build/cli.js --dir . --since 2023-01-01 --until 2023-12-31 --json
   ```

   - Verify date range filtering in JSON output timeRange field

## Cross-Platform Architecture

### Platform Detection

- CLI wrapper: `scripts/cli.ts` detects OS and delegates to appropriate script
- Windows: Uses `weekly-git-summary.js` (Node.js implementation)
- macOS/Linux: Prefers `weekly-git-summary.sh` (Bash), falls back to `weekly-git-summary.js`
- All platforms support identical CLI interface and features

### Build System Details

- Uses Bun build API targeting Node.js ESM modules
- Main entry points: `scripts/cli.ts` and `scripts/weekly-git-summary.ts`
- Copies platform scripts and HTML template to build directory
- TypeScript target: ESNext with strict mode enabled

## Development Workflow

### Code Changes

- Always build after code changes: `bun run build`
- Always test after changes: `bun test`
- Always lint before committing: `npm run lint:fix`
- File modification workflow: Edit TypeScript → Build → Test → Lint

### Common File Locations

- CLI entry point: `scripts/cli.ts`
- Core implementation: `scripts/weekly-git-summary.ts`
- Platform scripts: `scripts/weekly-git-summary.sh`, `scripts/weekly-git-summary.ps1`
- HTML template: `scripts/git-log.html`
- Tests: `tests/*.test.ts`
- Build output: `build/`

### Release Process

- Manual release: `bun run release` (interactive) or `bun run release:patch/minor/major`
- Automated via GitHub Actions on push to `release` branch
- Test release: `bun run release:dry`
- Pre-release: `bun run release:beta` or `bun run release:alpha`

## CI/CD Pipeline

### GitHub Actions Workflows

- **CI**: `.github/workflows/ci.yml` - Runs on push/PR to main
  - Tests on Ubuntu/Windows with Node.js 20/22
  - Build time: ~2-3 minutes. NEVER CANCEL. Set timeout to 10+ minutes.
  - Test time: ~1-2 minutes. NEVER CANCEL. Set timeout to 5+ minutes.
- **Release**: `.github/workflows/release.yml` - Manual workflow dispatch
- **Auto-Release**: `.github/workflows/auto-release.yml` - On push to release branch

### CI Requirements

- All tests must pass (40 tests)
- Build must succeed without errors
- TypeScript compilation must pass
- Security audit must pass: `bun audit`

## Troubleshooting

### Common Issues

- **Module type warnings**: Add `"type": "module"` to package.json
- **Node.js version errors**: Ensure Node.js ≥22.0.0 is installed
- **Bun network issues**: Fallback to `npm install` for dependencies
- **Date command errors on Linux**: Cosmetic issue in shell script, functionality unaffected
- **Build failures**: Clean build directory: `rm -rf build && bun run build`

### Performance Expectations

- **NEVER CANCEL builds or tests** - All operations complete within minutes
- Build: 5 seconds (fast due to Bun)
- Tests: 4 seconds (comprehensive but quick)
- Linting: 2 seconds
- CLI execution: 1-2 seconds per command

### Validation Commands

Always run these after changes:

```bash
# Full validation sequence
bun run build    # ~5 seconds
bun test        # ~4 seconds
npm run lint:fix # ~2 seconds
node build/cli.js --help
node build/cli.js --dir . --json | jq .timeRange
```

## Key Project Features

### Output Formats

- **Text**: Default colored terminal output with repository and commit summaries
- **JSON**: Structured data with timeRange, repositories, and commit arrays
- **Markdown**: Formatted reports with headers, lists, and metadata
- **HTML**: Interactive dashboard with charts, dark mode, and responsive design

### Repository Scanning

- Recursively scans directories up to 2 levels deep for Git repositories
- Extracts commit history within specified date ranges
- Filters by author names (supports spaces and special characters)
- Converts SSH URLs to HTTP format for web linking

### Cross-Platform Support

- Handles Windows/Unix path differences transparently
- Supports various author name escaping methods (quotes, backslashes)
- Consistent behavior across all supported platforms
- Robust error handling for missing dependencies

Remember: The CLI tool is a production-ready application. Always validate complete user workflows, not just individual commands.
