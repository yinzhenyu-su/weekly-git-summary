# weekly-git-summary

<div align="center">
  <img src="https://raw.githubusercontent.com/yinzhenyu-su/weekly-git-summary/main/scripts/dist/banner.svg" alt="weekly-git-summary Banner" width="100%">
</div>

[![npm version](https://img.shields.io/npm/v/weekly-git-summary.svg)](https://www.npmjs.com/package/weekly-git-summary)
[![Node version](https://img.shields.io/node/v/weekly-git-summary.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Language**: [English](README.md) | [中文](README.zh.md)

A cross-platform CLI tool for generating weekly Git commit summaries. Supports multiple output formats (text, JSON, Markdown), automatically scans project directories and extracts commit history within specified date ranges.

## 🚀 Features

- **Cross-platform Support** - Automatically detects system environment, uses Node.js on Windows, Bash or Node.js on macOS/Linux
- **Multiple Output Formats** - Supports colorized terminal output, JSON, Markdown, and HTML formats
- **Intelligent Repository Scanning** - Automatically scans Git repositories in specified directories (max depth 2 levels)
- **Flexible Time Ranges** - Supports custom dates and preset time ranges (today, this-week, last-month, etc.)
- **Multi-dimensional Filtering** - Supports multiple author filtering, message pattern matching (regex)
- **Conventional Commits** - Supports Conventional Commits parsing and statistical analysis
- **Visual Display** - Includes web visualization interface with chart support
- **Statistical Analysis** - Provides commit statistics, contributor analysis, type distribution, etc.
- **Zero Configuration** - Ready to use out of the box, no complex setup required

## 📦 Installation

### Global Installation

```bash
npm install -g weekly-git-summary
```

### Using npx (Recommended)

```bash
npx weekly-git-summary
```

## 🎯 Usage

### Basic Usage

```bash
# Generate weekly commit summary for current directory
weekly-git-summary

# Or use npx
npx weekly-git-summary
```

### Common Options

```bash
# Specify directory and date range
weekly-git-summary --dir ~/projects --since 2023-01-01 --until 2023-01-31

# Filter commits by specific author
weekly-git-summary --author "John Doe" --since 2023-01-01

# Multiple author filtering (OR relationship)
weekly-git-summary --author "John Doe" --author "Jane Smith" --author "Bob Wilson"

# Use preset time ranges
weekly-git-summary --time-range this-week
weekly-git-summary --time-range last-month

# Enable conventional commits analysis
weekly-git-summary --conventional --time-range this-week

# Message pattern filtering (supports regex)
weekly-git-summary --message-pattern "feat|fix" --conventional

# Output in different formats
weekly-git-summary --json
weekly-git-summary --md
weekly-git-summary --html

# Show help information
weekly-git-summary --help
```

## 📋 Command Line Arguments

| Argument            | Short | Description                               | Default     |
| ------------------- | ----- | ----------------------------------------- | ----------- |
| `--dir`             | `-d`  | Specify directory to scan                 | Current dir |
| `--since`           | `-s`  | Start date (YYYY-MM-DD)                   | This Monday |
| `--until`           | `-u`  | End date (YYYY-MM-DD)                     | Today       |
| `--author`          | `-a`  | Filter by author (can use multiple)       | All authors |
| `--message-pattern` |       | Filter commit messages by pattern (regex) | None        |
| `--conventional`    |       | Enable conventional commits parsing       | false       |
| `--time-range`      |       | Preset time range                         | None        |
| `--json`            | `-j`  | Output in JSON format                     | false       |
| `--md`              | `-m`  | Output in Markdown format                 | false       |
| `--html`            |       | Output in HTML format                     | false       |
| `--help`            | `-h`  | Show help information                     | -           |

### Time Range Presets

The `--time-range` parameter supports the following preset values:

- `today` - Today
- `yesterday` - Yesterday
- `this-week` - This week (Monday to Sunday)
- `last-week` - Last week
- `this-month` - This month
- `last-month` - Last month

## 📊 Output Formats

### 1. Colorized Terminal Output (Default)

```
Git Commit Summary

Time Range: 2023-06-26 to 2023-07-02
Search Directory: .

📦 my-project (github.com/user/my-project)

📅 2023-07-02
  • feat: add user authentication (author: John Doe, hash: abc123)
  • fix: fix login page styling (author: Jane Smith, hash: def456)

📅 2023-07-01
  • docs: update API documentation (author: Bob Wilson, hash: ghi789)

===== Statistics =====
Total commits: 15
Participants: 3
Contributors: John Doe, Jane Smith, Bob Wilson

===== Commit Type Distribution =====
Features: 8 times
Fixes: 4 times
Documentation: 2 times
Styling: 1 time
```

### 2. JSON Format

```json
{
  "timeRange": {
    "since": "2023-06-26",
    "until": "2023-07-02"
  },
  "searchDir": ".",
  "conventional": true,
  "messagePattern": "feat|fix",
  "statistics": {
    "totalCommits": 15,
    "participantCount": 3,
    "participants": ["John Doe", "Jane Smith", "Bob Wilson"],
    "typeDistribution": {
      "feat": 8,
      "fix": 4,
      "docs": 2,
      "style": 1
    }
  },
  "repositories": [
    {
      "name": "my-project",
      "url": "github.com/user/my-project",
      "commits": [
        {
          "date": "2023-07-02",
          "commits": [
            {
              "message": "feat: add user authentication",
              "author": "John Doe",
              "hash": "abc123",
              "type": "feat"
            }
          ]
        }
      ]
    }
  ]
}
```

### 3. Markdown Format

```markdown
# Git Commit Summary

- **Time Range**: 2023-06-26 to 2023-07-02
- **Search Directory**: .

## my-project

### 2023-07-02

- feat: add user authentication (author: John Doe, hash: abc123)
- fix: fix login page styling (author: Jane Smith, hash: def456)

### 2023-07-01

- docs: update API documentation (author: Bob Wilson, hash: ghi789)

## Statistics

- **Total Commits**: 15
- **Participants**: 3
- **Contributors**: John Doe, Jane Smith, Bob Wilson

### Commit Type Distribution

- **Features**: 8 times
- **Fixes**: 4 times
- **Documentation**: 2 times
- **Styling**: 1 time
```

## 🔧 Advanced Features

### Conventional Commits Support

When the `--conventional` parameter is enabled, the tool parses commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Enable conventional commits analysis
weekly-git-summary --conventional --time-range this-week
```

**Supported Commit Types:**

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation updates
- `style`: Code formatting
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Testing related
- `build`: Build system
- `ci`: CI configuration
- `chore`: Maintenance work
- `revert`: Revert changes

**Output Example:**

```
📅 2023-07-02
  • [Feature] Add user authentication (author: John Doe, hash: abc123)
  • [Fix] Fix login page styling [BREAKING] (author: Jane Smith, hash: def456)
```

### Message Pattern Filtering

Use the `--message-pattern` parameter to filter commit messages by specific patterns (supports regex):

```bash
# Show only feature and fix related commits
weekly-git-summary --message-pattern "feat|fix"

# Filter commits containing specific keywords
weekly-git-summary --message-pattern "user|login|auth"

# Use complex regular expressions
weekly-git-summary --message-pattern "^(feat|fix)(\(.+\))?:"
```

### Multiple Author Filtering

Supports filtering commits from multiple authors simultaneously (OR relationship):

```bash
# Filter multiple authors
weekly-git-summary --author "John Doe" --author "Jane Smith" --author "Bob Wilson"

# Support author names with spaces
weekly-git-summary --author "John Doe" --author "Jane Smith"
```

### Statistical Analysis

The tool automatically generates detailed statistics:

- **Basic Statistics**: Total commits, participant count, contributor list
- **Type Distribution**: Count statistics for various commit types (when `--conventional` is enabled)
- **Participation Analysis**: Contribution analysis for each participant

## 🎨 Visualization Interface

The project includes a beautiful web visualization interface (`git-log.html`) that provides:

- 🌓 Dark/Light theme toggle
- 📊 Commit type distribution radar charts
- 📈 Commit statistics cards
- 🕒 Interactive timeline
- 📱 Responsive design

![Text Format](https://raw.githubusercontent.com/yinzhenyu-su/weekly-git-summary/main/scripts/dist/weekly-git-summary-1.png)
![JSON Output](https://raw.githubusercontent.com/yinzhenyu-su/weekly-git-summary/main/scripts/dist/weekly-git-summary-2.png)
![Web Visualization Interface](https://raw.githubusercontent.com/yinzhenyu-su/weekly-git-summary/main/scripts/dist/weekly-git-summary-3.png)

## 🛠️ Development

### Environment Requirements

- Node.js ≥ 22.0.0
- Bun (for building)
- Git command line tools

### Local Development

```bash
# Clone the project
git clone <repository-url>
cd weekly-git-summary

# Install dependencies
bun install

# Build the project
bun run build

# Run tests
bun test

# Watch mode testing
bun test --watch

# Local link testing
npm link
weekly-git-summary --help
```

### Project Structure

```bash
weekly-git-summary/
├── scripts/
│   ├── cli.ts                 # CLI entry point (TypeScript)
│   ├── weekly-git-summary.ts  # TypeScript script implementation
│   ├── weekly-git-summary.sh  # Shell script implementation
│   ├── weekly-git-summary.ps1 # PowerShell script implementation
│   ├── git-log.html           # Web visualization interface template
│   └── dist/                  # Example screenshots
├── tests/
│   ├── cli.test.ts            # CLI functionality tests
│   ├── build.test.ts          # Build system tests
│   ├── integration.test.ts    # Integration tests
│   └── windows.test.ts        # Windows compatibility tests
├── docs/
│   ├── FAQ.md                 # Frequently asked questions
│   └── RELEASE.md             # Release management guide
├── build/                     # Build output directory
├── build.ts                   # Bun build configuration
├── package.json              # Project configuration
├── tsconfig.json             # TypeScript configuration
├── CLAUDE.md                 # Project development guide
└── README.md                 # Project documentation
```

### Architecture Design

This project uses an intelligent cross-platform architecture:

1. **TypeScript CLI Wrapper** (`scripts/cli.ts`)
   - Detects operating system type
   - Automatically selects corresponding script implementation
   - Transparently passes command line arguments

2. **Platform-specific Implementations**
   - **Windows**: Node.js script (cross-platform compatible)
   - **macOS/Linux**: Bash script (with integrated URL conversion) or Node.js script (fallback)
   - **PowerShell**: Supports Windows PowerShell environment
   - Identical functionality, unified parameter format

3. **Build System**
   - Uses Bun for TypeScript compilation
   - Outputs ESM format Node.js modules
   - Automatically generates executable CLI tools

## 🧪 Testing

The project includes a comprehensive test suite:

```bash
# Run all tests
bun test

# View test coverage
bun test --coverage
```

### Test Coverage

- **CLI Functionality Tests** - Verify command line argument processing, output formats, etc.
- **Build System Tests** - Verify build process and output files
- **Cross-platform Compatibility** - Verify behavior in different system environments
- **Error Handling** - Verify handling of exceptional situations

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Issues and Pull Requests are welcome!

### Contributing Guidelines

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Standards

- Use TypeScript for type-safe development
- Follow ESLint and Prettier conventions
- Add corresponding tests for new features
- Update relevant documentation

## 🔗 Related Links

- [npm Package](https://www.npmjs.com/package/weekly-git-summary)
- [GitHub Repository](https://github.com/yinzhenyu-su/weekly-git-summary)
- [Issue Reports](https://github.com/yinzhenyu-su/weekly-git-summary/issues)

## 📞 Support

If you encounter any issues or have feature suggestions, please:

1. Check the [FAQ](docs/FAQ.md)
2. Search existing [Issues](https://github.com/yinzhenyu-su/weekly-git-summary/issues)
3. Create a new Issue describing your problem

---

**Like this project? Please give it a ⭐️**
