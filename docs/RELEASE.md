# Release Management Guide

**Language**: [English](RELEASE.md) | [中文](RELEASE.zh.md)

This project uses [release-it](https://github.com/release-it/release-it) to manage version releases and npm package publishing.

## Release Methods

### 1. Manual Release

#### Local Release

```bash
# Test release process (dry run, won't actually release)
bun run release:dry

# Release patch version (1.0.0 -> 1.0.1)
bun run release:patch

# Release minor version (1.0.0 -> 1.1.0)
bun run release:minor

# Release major version (1.0.0 -> 2.0.0)
bun run release:major

# Release pre-release versions
bun run release:beta    # 1.0.0 -> 1.0.1-beta.0
bun run release:alpha   # 1.0.0 -> 1.0.1-alpha.0

# Interactive release (recommended)
bun run release
```

#### GitHub Actions Manual Trigger

1. Visit the Actions page of your GitHub repository
2. Select the "Release" workflow
3. Click "Run workflow"
4. Choose release type: patch/minor/major/beta/alpha
5. Click "Run workflow" to confirm

### 2. Automatic Release

#### Automatic Release via release Branch

When code is pushed to the `release` branch, it automatically triggers the release process:

```bash
# Create release branch
git checkout -b release
git push origin release

# Or push to existing release branch
git checkout release
git merge main
git push origin release
```

Automatic release determines version type based on commit messages:

- `BREAKING CHANGE` or `feat!` → major version
- `feat:` → minor version
- `fix:` or others → patch version

## Release Process

release-it automatically performs the following steps:

1. **Pre-checks**
   - Run tests: `bun run test`
   - Build project: `bun run build`
   - Check if working directory is clean
   - Check for upstream branch

2. **Version Upgrade**
   - Upgrade version number according to semantic versioning rules
   - Update version in `package.json`

3. **Generate CHANGELOG**
   - Automatically generate changelog based on conventional commits
   - Update `CHANGELOG.md` file

4. **Git Operations**
   - Create release commit: `chore: release v${version}`
   - Create Git tag: `v${version}`
   - Push to remote repository

5. **GitHub Release**
   - Create GitHub Release
   - Auto-generate Release Notes
   - Upload build artifacts

6. **NPM Publishing**
   - Publish to npm registry
   - Set as public package

## Configuration

### release-it Configuration File (`.release-it.json`)

Main configuration items:

- **git**: Git-related configuration (commit messages, tags, push, etc.)
- **github**: GitHub Release configuration
- **npm**: NPM publishing configuration
- **hooks**: Hook functions during release process
- **plugins**: Plugin configuration (conventional changelog)

### GitHub Actions Configuration

Need to configure the following GitHub Secrets:

- `GITHUB_TOKEN`: Automatically provided, used for GitHub operations
- `NPM_TOKEN`: Manually added, used for NPM publishing

#### Setting up NPM_TOKEN

1. Login to [npmjs.com](https://www.npmjs.com/)
2. Go to Account Settings → Access Tokens
3. Create a new Automation Token
4. Add Secret in GitHub repository settings: `NPM_TOKEN`

## Version Standards

The project follows [Semantic Versioning](https://semver.org/) standards:

- **MAJOR**: Incompatible API changes
- **MINOR**: Backward-compatible feature additions
- **PATCH**: Backward-compatible bug fixes

### Commit Message Standards

Uses [Conventional Commits](https://www.conventionalcommits.org/) standards:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Type descriptions:

- `feat`: New features (MINOR)
- `fix`: Bug fixes (PATCH)
- `docs`: Documentation updates
- `style`: Code formatting (doesn't affect functionality)
- `refactor`: Refactoring (no new features or bug fixes)
- `perf`: Performance optimization (PATCH)
- `test`: Testing related
- `build`: Build system or dependency changes
- `ci`: CI configuration changes
- `chore`: Maintenance changes

Breaking changes:

- Add `!` after type: `feat!: remove deprecated API`
- Or add in footer: `BREAKING CHANGE: description`

## Troubleshooting

### Common Issues

1. **NPM Publishing Fails**
   - Check if `NPM_TOKEN` is correctly set
   - Confirm package name isn't already taken
   - Check network connection

2. **GitHub Release Fails**
   - Check `GITHUB_TOKEN` permissions
   - Confirm repository permission settings

3. **Version Number Conflicts**
   - Check if local and remote branches are synchronized
   - Confirm tags don't already exist

4. **Test Failures**
   - Ensure all tests pass
   - Check if build succeeds

### Rolling Back Releases

If there are issues with a release, you can:

1. **NPM Package Rollback**

   ```bash
   npm unpublish weekly-git-summary@version --force
   ```

2. **Delete GitHub Release**
   - Manually delete Release and Tag on GitHub page

3. **Delete Git Tag**
   ```bash
   git tag -d v<version>
   git push origin :refs/tags/v<version>
   ```

## Best Practices

1. **Before Release**
   - Ensure all tests pass
   - Check CHANGELOG content
   - Verify build artifacts

2. **Version Selection**
   - Follow semantic versioning standards
   - Be cautious with major version upgrades
   - Use pre-release versions for testing

3. **Documentation Maintenance**
   - Update README promptly
   - Keep CHANGELOG accurate
   - Update usage examples

## Release Checklist

### Pre-release Checklist

- [ ] All tests pass (`bun test`)
- [ ] Build succeeds (`bun run build`)
- [ ] Documentation is up to date
- [ ] CHANGELOG is updated
- [ ] Version number follows semantic versioning
- [ ] No uncommitted changes
- [ ] Remote branch is up to date

### Post-release Checklist

- [ ] GitHub Release is created
- [ ] NPM package is published
- [ ] Documentation links are updated
- [ ] Announce release in relevant channels
- [ ] Monitor for any immediate issues
- [ ] Update project boards/issues as needed

### Emergency Release Process

For critical bug fixes that need immediate release:

1. Create hotfix branch from main
2. Apply minimal fix
3. Test thoroughly
4. Use `bun run release:patch` for immediate patch release
5. Merge back to main and develop branches

---

💡 **Note**: Always test the release process in a development environment before performing production releases. Use `bun run release:dry` to simulate the release process without actually publishing.