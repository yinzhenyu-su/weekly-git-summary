# Frequently Asked Questions (FAQ)

**Language**: [English](FAQ.md) | [中文](FAQ.zh.md)

## 📋 Table of Contents

- [Installation and Environment Issues](#installation-and-environment-issues)
- [Usage Related Questions](#usage-related-questions)
- [Output Format Questions](#output-format-questions)
- [Git Related Questions](#git-related-questions)
- [Cross-platform Issues](#cross-platform-issues)
- [Performance and Limitations](#performance-and-limitations)
- [Troubleshooting](#troubleshooting)

## 🛠️ Installation and Environment Issues

### Q: After installation, running `weekly-git-summary` shows "command not found"?

**A:** Please ensure:

1. Use the `-g` parameter for global installation: `npm install -g weekly-git-summary`
2. Check if npm global installation path is in PATH: `npm config get prefix`
3. Reload terminal or execute `source ~/.bashrc` / `source ~/.zshrc`
4. Or use `npx weekly-git-summary` without global installation

### Q: Getting "Node.js version too low" error?

**A:** This tool requires Node.js ≥ 22.0.0, please:

1. Check current version with `node --version`
2. Upgrade to the latest Node.js version
3. Recommend using nvm to manage Node.js versions: `nvm install node && nvm use node`

### Q: Windows shows PowerShell script execution blocked?

**A:** This is PowerShell's security policy, please:

1. Run PowerShell as administrator
2. Execute: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Or change to Bypass policy: `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser`

## 🎯 Usage Related Questions

### Q: How to generate reports for specific time ranges?

**A:** Use `--since` and `--until` parameters:

```bash
weekly-git-summary --since 2023-01-01 --until 2023-12-31
```

### Q: How to view commits from specific authors only?

**A:** Use the `--author` parameter:

```bash
# Single author
weekly-git-summary --author "John Doe"

# Multiple authors (OR relationship)
weekly-git-summary --author "John Doe" --author "Jane Smith" --author "Bob Wilson"

# Using email
weekly-git-summary --author "johndoe@example.com"

# Handle author names with spaces
weekly-git-summary --author "John Doe" --author "Jane Smith"
```

### Q: How to scan multiple project directories?

**A:** The tool automatically scans all Git repositories in the specified directory (max depth 2 levels):

```bash
weekly-git-summary --dir ~/projects
```

### Q: Why are there no commit records?

**A:** Possible reasons:

1. No commits within the specified time range
2. No Git repositories in the directory
3. Author filter conditions are too strict
4. Current user doesn't have access permissions to Git repositories
5. Message pattern filter conditions are too strict

### Q: How to use time range presets?

**A:** Use the `--time-range` parameter:

```bash
# Today's commits
weekly-git-summary --time-range today

# Yesterday's commits
weekly-git-summary --time-range yesterday

# This week's commits
weekly-git-summary --time-range this-week

# Last week's commits
weekly-git-summary --time-range last-week

# This month's commits
weekly-git-summary --time-range this-month

# Last month's commits
weekly-git-summary --time-range last-month
```

### Q: How to enable conventional commits analysis?

**A:** Use the `--conventional` parameter:

```bash
# Enable conventional commits analysis
weekly-git-summary --conventional

# Combine with time range
weekly-git-summary --conventional --time-range this-week

# Combine with author filtering
weekly-git-summary --conventional --author "John Doe"
```

This will display commit type distribution and breaking change indicators.

### Q: How to filter specific types of commit messages?

**A:** Use the `--message-pattern` parameter (supports regular expressions):

```bash
# Show only feature and fix related commits
weekly-git-summary --message-pattern "feat|fix"

# Filter commits containing specific keywords
weekly-git-summary --message-pattern "user|login|auth"

# Use regular expressions for filtering
weekly-git-summary --message-pattern "^(feat|fix)(\(.+\))?:"

# Combine with conventional commits
weekly-git-summary --message-pattern "feat" --conventional
```

## 📊 Output Format Questions

### Q: How to export to files?

**A:** Use output redirection:

```bash
# Export as Markdown file
weekly-git-summary --md > report.md

# Export as JSON file
weekly-git-summary --json > report.json

# Export as HTML file
weekly-git-summary --html > report.html
```

### Q: Terminal displays garbled characters or incorrect formatting?

**A:** Please ensure:

1. Terminal supports UTF-8 encoding
2. Use terminals that support colors (like iTerm2, Windows Terminal)
3. Set `LANG=en_US.UTF-8` environment variable

### Q: Can JSON output be used with other tools?

**A:** Yes, JSON format output is designed for integration with other tools:

```bash
# Use jq to process JSON output
weekly-git-summary --json | jq '.repositories[0].commits'

# Extract statistics information
weekly-git-summary --json --conventional | jq '.statistics'

# Get commit type distribution
weekly-git-summary --json --conventional | jq '.statistics.typeDistribution'

# Import to database or other systems
weekly-git-summary --json | curl -X POST -d @- http://your-api.com/reports
```

### Q: How to view detailed statistics?

**A:** The tool automatically displays statistics including:

- Total commit count
- Number of participants and participant list
- Commit type distribution (when `--conventional` is enabled)

```bash
# View basic statistics
weekly-git-summary --time-range this-week

# View statistics with type analysis
weekly-git-summary --conventional --time-range this-week

# JSON format output contains complete statistical data
weekly-git-summary --json --conventional
```

## 🔧 Git Related Questions

### Q: What types of Git repositories are supported?

**A:** Supports all standard Git repositories:

- Local Git repositories
- Local clones of remote repositories (GitHub, GitLab, Bitbucket, etc.)
- Bare repositories
- Worktrees

### Q: How are SSH and HTTPS repository URLs handled?

**A:** The tool automatically converts SSH URLs to HTTPS format for display in reports:

- `git@github.com:user/repo.git` → `https://github.com/user/repo`
- `ssh://git@gitlab.com/user/repo.git` → `https://gitlab.com/user/repo`

### Q: How to handle private repositories?

**A:** Ensure:

1. Git credentials are properly configured
2. You have read access to private repositories
3. SSH keys or access tokens are properly set up

## 🌍 Cross-platform Issues

### Q: Inconsistent output results on different systems?

**A:** While core functionality is consistent, there may be minor differences:

- Date format parsing differences between Windows (PowerShell) and Unix (Bash)
- File path separator differences
- Color display support differences

### Q: Permission errors on macOS?

**A:** You may need to:

1. Grant terminal full disk access permissions
2. Use `sudo` to run (not recommended)
3. Check directory permissions: `ls -la /path/to/directory`

### Q: Missing dependencies on Linux?

**A:** Ensure necessary tools are installed:

```bash
# Ubuntu/Debian
sudo apt-get install git nodejs npm

# CentOS/RHEL
sudo yum install git nodejs npm

# Arch Linux
sudo pacman -S git nodejs npm
```

## ⚡ Performance and Limitations

### Q: What to do when scanning large projects is slow?

**A:** Optimization suggestions:

1. Reduce scanning depth (tool defaults to max depth 2 levels)
2. Narrow time range: `--since 2023-01-01 --until 2023-01-31`
3. Specify specific project directories instead of root directory
4. Use `--author` to filter specific authors

### Q: Is there a limit on the number of repositories scanned?

**A:** No hard limit, but recommendations:

- Single scan should not exceed 100 repositories
- Large projects can be processed in batches
- Use JSON output for easier subsequent processing

### Q: High memory usage?

**A:** For large projects:

1. Use streaming processing, avoid loading all data at once
2. Generate reports by time periods
3. Clean unnecessary Git objects: `git gc`

## 🔍 Troubleshooting

### Q: Getting "git command not found" error?

**A:** Please ensure:

1. Git is installed: `git --version`
2. Git is in PATH environment variable
3. Restart terminal or reload environment variables

### Q: Script execution fails?

**A:** Troubleshooting steps:

1. Check if script files exist
2. Confirm execution permissions: `chmod +x scripts/weekly-git-summary.sh`
3. View detailed error information
4. Try executing script manually

### Q: Some repositories are skipped?

**A:** Possible reasons:

1. Not a valid Git repository
2. Repository is corrupted or incomplete
3. Insufficient permissions
4. Symbolic links point to invalid paths

### Q: Missing some commits in output?

**A:** Check:

1. Whether commits are within the specified time range
2. Whether committer name/email matches filter conditions
3. Whether it's a merge commit
4. Whether local repository is synchronized with latest changes

## 📞 Getting Help

### Q: How to report issues or suggest features?

**A:** Please visit:

1. **GitHub Issues**: https://github.com/yinzhenyu-su/weekly-git-summary/issues
2. **Search existing issues**: Look for similar problems
3. **Provide detailed information**: Include system info, error messages, reproduction steps
4. **Feature requests**: Describe requirements and use cases in detail

### Q: How to contribute code?

**A:** Contributions welcome! Please:

1. Fork the project to your GitHub
2. Create a feature branch
3. Add test cases
4. Submit a Pull Request
5. Refer to contributing guidelines in README.md

### Q: How to get the latest version?

**A:** Check for updates:

```bash
# Check current version
weekly-git-summary --version

# Update to latest version
npm update -g weekly-git-summary

# Or reinstall
npm uninstall -g weekly-git-summary
npm install -g weekly-git-summary
```

---

💡 **Tip**: If your question isn't answered here, please check [GitHub Issues](https://github.com/yinzhenyu-su/weekly-git-summary/issues) or create a new issue. We'll respond as soon as possible!