# 常见问题 (FAQ)

## 📋 目录

- [安装和环境问题](#安装和环境问题)
- [使用相关问题](#使用相关问题)
- [输出格式问题](#输出格式问题)
- [Git 相关问题](#git-相关问题)
- [跨平台问题](#跨平台问题)
- [性能和限制](#性能和限制)
- [故障排除](#故障排除)

## 🛠️ 安装和环境问题

### Q: 安装后运行 `weekly-git-summary` 提示"命令未找到"？

**A:** 请确保：

1. 使用 `-g` 参数进行全局安装：`npm install -g weekly-git-summary`
2. 检查 npm 全局安装路径是否在 PATH 中：`npm config get prefix`
3. 重新加载终端或执行 `source ~/.bashrc` / `source ~/.zshrc`
4. 或者使用 `npx weekly-git-summary` 无需全局安装

### Q: 提示 Node.js 版本过低？

**A:** 该工具要求 Node.js ≥ 22.0.0，请：

1. 使用 `node --version` 检查当前版本
2. 升级到最新的 Node.js 版本
3. 推荐使用 nvm 管理 Node.js 版本：`nvm install node && nvm use node`

### Q: Windows 上提示 PowerShell 脚本执行被阻止？

**A:** 这是 PowerShell 的安全策略，请：

1. 以管理员身份运行 PowerShell
2. 执行：`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. 或者修改为 Bypass 策略：`Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser`

## 🎯 使用相关问题

### Q: 如何生成指定时间范围的报告？

**A:** 使用 `--since` 和 `--until` 参数：

```bash
weekly-git-summary --since 2023-01-01 --until 2023-12-31
```

### Q: 如何只查看特定作者的提交？

**A:** 使用 `--author` 参数：

```bash
weekly-git-summary --author "张三"
# 或者使用邮箱
weekly-git-summary --author "zhangsan@example.com"
```

### Q: 如何扫描多个项目目录？

**A:** 工具会自动扫描指定目录下的所有 Git 仓库（最大深度 2 层）：

```bash
weekly-git-summary --dir ~/projects
```

### Q: 没有提交记录是怎么回事？

**A:** 可能的原因：

1. 指定的时间范围内没有提交
2. 目录中没有 Git 仓库
3. 作者过滤条件太严格
4. 当前用户没有访问 Git 仓库的权限

## 📊 输出格式问题

### Q: 如何导出为文件？

**A:** 使用输出重定向：

```bash
# 导出为 Markdown 文件
weekly-git-summary --md > report.md

# 导出为 JSON 文件
weekly-git-summary --json > report.json

# 导出为 HTML 文件
weekly-git-summary --html > report.html
```

### Q: 终端显示乱码或格式不正确？

**A:** 请确保：

1. 终端支持 UTF-8 编码
2. 使用支持颜色的终端（如 iTerm2、Windows Terminal）
3. 设置 `LANG=zh_CN.UTF-8` 环境变量

### Q: JSON 输出可以用于其他工具吗？

**A:** 是的，JSON 格式输出设计用于与其他工具集成：

```bash
# 使用 jq 处理 JSON 输出
weekly-git-summary --json | jq '.repositories[0].commits'

# 导入到数据库或其他系统
weekly-git-summary --json | curl -X POST -d @- http://your-api.com/reports
```

## 🔧 Git 相关问题

### Q: 支持哪些 Git 仓库类型？

**A:** 支持所有标准 Git 仓库：

- 本地 Git 仓库
- GitHub、GitLab、Bitbucket 等远程仓库的本地克隆
- 裸仓库（bare repository）
- 工作树（worktree）

### Q: SSH 和 HTTPS 的仓库 URL 如何处理？

**A:** 工具会自动转换 SSH URL 为 HTTPS 格式以便在报告中显示：

- `git@github.com:user/repo.git` → `https://github.com/user/repo`
- `ssh://git@gitlab.com/user/repo.git` → `https://gitlab.com/user/repo`

### Q: 如何处理私有仓库？

**A:** 确保：

1. 已正确配置 Git 凭据
2. 对私有仓库有读取权限
3. SSH 密钥或访问令牌已正确设置

## 🌍 跨平台问题

### Q: 在不同系统上输出结果不一致？

**A:** 虽然核心功能一致，但可能存在细微差异：

- Windows (PowerShell) 和 Unix (Bash) 的日期格式解析
- 文件路径分隔符差异
- 颜色显示支持差异

### Q: macOS 上提示权限错误？

**A:** 可能需要：

1. 给予终端完全磁盘访问权限
2. 使用 `sudo` 运行（不推荐）
3. 检查目录权限：`ls -la /path/to/directory`

### Q: Linux 上缺少依赖？

**A:** 确保安装了必要的工具：

```bash
# Ubuntu/Debian
sudo apt-get install git nodejs npm

# CentOS/RHEL
sudo yum install git nodejs npm

# Arch Linux
sudo pacman -S git nodejs npm
```

## ⚡ 性能和限制

### Q: 扫描大型项目很慢怎么办？

**A:** 优化建议：

1. 减少扫描深度（工具默认最大深度 2 层）
2. 缩小时间范围：`--since 2023-01-01 --until 2023-01-31`
3. 指定具体项目目录而非根目录
4. 使用 `--author` 过滤特定作者

### Q: 有扫描仓库数量限制吗？

**A:** 没有硬性限制，但建议：

- 单次扫描不超过 100 个仓库
- 超大项目可分批处理
- 使用 JSON 输出便于后续处理

### Q: 内存占用过高？

**A:** 对于大型项目：

1. 使用流式处理，避免一次性加载所有数据
2. 分时间段生成报告
3. 清理不必要的 Git 对象：`git gc`

## 🔍 故障排除

### Q: 提示"git 命令未找到"？

**A:** 请确保：

1. 已安装 Git：`git --version`
2. Git 在 PATH 环境变量中
3. 重启终端或重新加载环境变量

### Q: 脚本执行失败？

**A:** 排查步骤：

1. 检查脚本文件是否存在
2. 确认有执行权限：`chmod +x scripts/weekly-git-summary.sh`
3. 查看详细错误信息
4. 尝试手动执行脚本

### Q: 某些仓库被跳过？

**A:** 可能原因：

1. 不是有效的 Git 仓库
2. 仓库损坏或不完整
3. 权限不足
4. 符号链接指向无效路径

### Q: 输出中缺少某些提交？

**A:** 检查：

1. 提交是否在指定时间范围内
2. 提交者姓名/邮箱是否匹配过滤条件
3. 是否是合并提交（merge commit）
4. 本地仓库是否已同步最新更改

## 📞 获取帮助

### Q: 如何报告问题或建议功能？

**A:** 请访问：

1. **GitHub Issues**: https://github.com/yinzhenyu/weekly-git-summary/issues
2. **查看已有问题**: 搜索是否有相似问题
3. **提供详细信息**: 包括系统信息、错误消息、重现步骤
4. **功能请求**: 详细描述需求和使用场景

### Q: 如何贡献代码？

**A:** 欢迎贡献！请：

1. Fork 项目到自己的 GitHub
2. 创建功能分支
3. 添加测试用例
4. 提交 Pull Request
5. 参考 README.md 中的贡献指南

### Q: 如何获取最新版本？

**A:** 检查更新：

```bash
# 检查当前版本
weekly-git-summary --version

# 更新到最新版本
npm update -g weekly-git-summary

# 或重新安装
npm uninstall -g weekly-git-summary
npm install -g weekly-git-summary
```

---

💡 **提示**: 如果您的问题没有在这里找到答案，请查看 [GitHub Issues](https://github.com/yinzhenyu/weekly-git-summary/issues) 或创建新的问题。我们会尽快回复！
