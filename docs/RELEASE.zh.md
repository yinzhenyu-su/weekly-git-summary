# 发布管理指南

**语言**: [English](RELEASE.md) | [中文](RELEASE.zh.md)

本项目使用 [release-it](https://github.com/release-it/release-it) 来管理版本发布和 npm 包发布。

## 发布方式

### 1. 手动发布

#### 本地发布

```bash
# 测试发布流程（不会实际发布）
bun run release:dry

# 发布补丁版本 (1.0.0 -> 1.0.1)
bun run release:patch

# 发布次要版本 (1.0.0 -> 1.1.0)
bun run release:minor

# 发布主要版本 (1.0.0 -> 2.0.0)
bun run release:major

# 发布预发布版本
bun run release:beta    # 1.0.0 -> 1.0.1-beta.0
bun run release:alpha   # 1.0.0 -> 1.0.1-alpha.0

# 交互式发布（推荐）
bun run release
```

#### GitHub Actions 手动触发

1. 访问 GitHub 仓库的 Actions 页面
2. 选择 "Release" 工作流
3. 点击 "Run workflow"
4. 选择发布类型：patch/minor/major/beta/alpha
5. 点击 "Run workflow" 确认

### 2. 自动发布

#### 通过 release 分支自动发布

当代码推送到 `release` 分支时，会自动触发发布流程：

```bash
# 创建 release 分支
git checkout -b release
git push origin release

# 或者推送到现有 release 分支
git checkout release
git merge main
git push origin release
```

自动发布会根据提交信息确定版本类型：

- `BREAKING CHANGE` 或 `feat!` → major 版本
- `feat:` → minor 版本
- `fix:` 或其他 → patch 版本

## 发布流程

release-it 会自动执行以下步骤：

1. **前置检查**
   - 运行测试：`bun run test`
   - 构建项目：`bun run build`
   - 检查工作目录是否干净
   - 检查是否有上游分支

2. **版本升级**
   - 根据语义化版本规则升级版本号
   - 更新 `package.json` 中的版本

3. **生成 CHANGELOG**
   - 基于 conventional commits 自动生成变更日志
   - 更新 `CHANGELOG.md` 文件

4. **Git 操作**
   - 创建发布提交：`chore: release v${version}`
   - 创建 Git 标签：`v${version}`
   - 推送到远程仓库

5. **GitHub Release**
   - 创建 GitHub Release
   - 自动生成 Release Notes
   - 上传构建产物

6. **NPM 发布**
   - 发布到 npm registry
   - 设置为公开包

## 配置说明

### release-it 配置文件 (`.release-it.json`)

主要配置项：

- **git**: Git 相关配置（提交信息、标签、推送等）
- **github**: GitHub Release 配置
- **npm**: NPM 发布配置
- **hooks**: 发布过程中的钩子函数
- **plugins**: 插件配置（conventional changelog）

### GitHub Actions 配置

需要配置以下 GitHub Secrets：

- `GITHUB_TOKEN`: 自动提供，用于 GitHub 操作
- `NPM_TOKEN`: 需要手动添加，用于 NPM 发布

#### 设置 NPM_TOKEN

1. 登录 [npmjs.com](https://www.npmjs.com/)
2. 进入 Account Settings → Access Tokens
3. 创建新的 Automation Token
4. 在 GitHub 仓库设置中添加 Secret：`NPM_TOKEN`

## 版本规范

项目遵循 [语义化版本](https://semver.org/) 规范：

- **MAJOR**: 不兼容的 API 修改
- **MINOR**: 向下兼容的功能新增
- **PATCH**: 向下兼容的问题修正

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型说明：

- `feat`: 新功能 (MINOR)
- `fix`: 修复 bug (PATCH)
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构（不添加功能也不修复 bug）
- `perf`: 性能优化 (PATCH)
- `test`: 测试相关
- `build`: 构建系统或依赖变更
- `ci`: CI 配置变更
- `chore`: 维护性变更

破坏性更改：

- 在类型后添加 `!`：`feat!: remove deprecated API`
- 或在 footer 中添加：`BREAKING CHANGE: description`

## 故障排除

### 常见问题

1. **NPM 发布失败**
   - 检查 `NPM_TOKEN` 是否正确设置
   - 确认包名是否已被占用
   - 检查网络连接

2. **GitHub Release 失败**
   - 检查 `GITHUB_TOKEN` 权限
   - 确认仓库权限设置

3. **版本号冲突**
   - 检查本地和远程分支是否同步
   - 确认标签是否已存在

4. **测试失败**
   - 确保所有测试通过
   - 检查构建是否成功

### 回滚发布

如果发布有问题，可以：

1. **NPM 包回滚**

   ```bash
   npm unpublish weekly-git-summary@版本号 --force
   ```

2. **GitHub Release 删除**
   - 在 GitHub 页面手动删除 Release 和 Tag

3. **Git 标签删除**
   ```bash
   git tag -d v版本号
   git push origin :refs/tags/v版本号
   ```

## 最佳实践

1. **发布前**
   - 确保所有测试通过
   - 检查 CHANGELOG 内容
   - 验证构建产物

2. **版本选择**
   - 遵循语义化版本规范
   - 谨慎使用 major 版本升级
   - 使用预发布版本测试

3. **文档维护**
   - 及时更新 README
   - 保持 CHANGELOG 准确性
   - 更新使用示例
