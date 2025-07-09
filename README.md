# weekly-git-summary

<div align="center">
  <img src="https://raw.githubusercontent.com/yinzhenyu-su/weekly-git-summary/main/scripts/dist/banner.svg" alt="weekly-git-summary Banner" width="100%">
</div>

[![npm version](https://img.shields.io/npm/v/weekly-git-summary.svg)](https://www.npmjs.com/package/weekly-git-summary)
[![Node version](https://img.shields.io/node/v/weekly-git-summary.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个跨平台的 CLI 工具，用于生成 Git 提交记录的周报汇总。支持多种输出格式（文本、JSON、Markdown），自动扫描项目目录并提取指定时间范围内的提交历史。

## 🚀 特性

- **跨平台支持** - 自动检测系统环境，Windows 使用 Node.js，macOS/Linux 使用 Bash 或 Node.js
- **多种输出格式** - 支持彩色终端输出、JSON 格式、Markdown 格式
- **智能仓库扫描** - 自动扫描指定目录下的 Git 仓库（最大深度 2 层）
- **灵活的时间范围** - 支持自定义开始和结束日期
- **作者过滤** - 可以按特定作者筛选提交记录
- **可视化展示** - 包含 Web 可视化界面，支持图表展示
- **零配置使用** - 开箱即用，无需复杂配置

## 📦 安装

### 全局安装

```bash
npm install -g weekly-git-summary
```

### 使用 npx（推荐）

```bash
npx weekly-git-summary
```

## 🎯 使用方法

### 基本用法

```bash
# 生成当前目录的本周提交汇总
weekly-git-summary

# 或使用 npx
npx weekly-git-summary
```

### 常用选项

```bash
# 指定目录和时间范围
weekly-git-summary --dir ~/projects --since 2023-01-01 --until 2023-01-31

# 过滤特定作者的提交
weekly-git-summary --author "张三" --since 2023-01-01

# 输出 JSON 格式
weekly-git-summary --json

# 输出 Markdown 格式
weekly-git-summary --md

# 显示帮助信息
weekly-git-summary --help
```

## 📋 命令行参数

| 参数       | 简写 | 描述                  | 默认值   |
| ---------- | ---- | --------------------- | -------- |
| `--dir`    | `-d` | 指定要扫描的目录      | 当前目录 |
| `--since`  | `-s` | 开始日期 (YYYY-MM-DD) | 本周一   |
| `--until`  | `-u` | 结束日期 (YYYY-MM-DD) | 今天     |
| `--author` | `-a` | 按作者过滤提交        | 所有作者 |
| `--json`   | `-j` | 以 JSON 格式输出      | false    |
| `--md`     | `-m` | 以 Markdown 格式输出  | false    |
| `--html`   |      | 以 HTML 格式输出      | false    |
| `--help`   | `-h` | 显示帮助信息          | -        |

## 📊 输出格式

### 1. 彩色终端输出（默认）

```
工作内容Git提交记录汇总

统计时间范围: 2023-06-26 到 2023-07-02
搜索目录: .

📦 my-project (github.com/user/my-project)

📅 2023-07-02
  • feat: 添加用户认证功能 (作者: 张三, hash: abc123)
  • fix: 修复登录页面样式问题 (作者: 李四, hash: def456)

📅 2023-07-01
  • docs: 更新 API 文档 (作者: 王五, hash: ghi789)
```

### 2. JSON 格式

```json
{
  "timeRange": {
    "since": "2023-06-26",
    "until": "2023-07-02"
  },
  "searchDir": ".",
  "repositories": [
    {
      "name": "my-project",
      "url": "github.com/user/my-project",
      "commits": [
        {
          "date": "2023-07-02",
          "commits": [
            {
              "message": "feat: 添加用户认证功能",
              "author": "张三",
              "hash": "abc123"
            }
          ]
        }
      ]
    }
  ]
}
```

### 3. Markdown 格式

```markdown
# 工作内容 Git 提交记录汇总

- **统计时间范围**: 2023-06-26 到 2023-07-02
- **搜索目录**: .

## my-project

### 2023-07-02

- feat: 添加用户认证功能 (作者: 张三, hash: abc123)
- fix: 修复登录页面样式问题 (作者: 李四, hash: def456)

### 2023-07-01

- docs: 更新 API 文档 (作者: 王五, hash: ghi789)
```

## 🎨 可视化界面

项目包含一个精美的 Web 可视化界面 (`git-log.html`)，提供：

- 🌓 深色/浅色主题切换
- 📊 提交类型分布雷达图
- 📈 提交统计卡片
- 🕒 交互式时间线
- 📱 响应式设计

![纯文本格式](https://raw.githubusercontent.com/yinzhenyu-su/weekly-git-summary/main/scripts/dist/weekly-git-summary-1.png)
![JSON 输出](https://raw.githubusercontent.com/yinzhenyu-su/weekly-git-summary/main/scripts/dist/weekly-git-summary-2.png)
![Web 可视化界面](https://raw.githubusercontent.com/yinzhenyu-su/weekly-git-summary/main/scripts/dist/weekly-git-summary-3.png)

## 🛠️ 开发

### 环境要求

- Node.js ≥ 22.0.0
- Bun (用于构建)
- Git 命令行工具

### 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd weekly-git-summary

# 安装依赖
bun install

# 构建项目
bun run build

# 运行测试
bun test

# 监视模式测试
bun test --watch

# 本地链接测试
npm link
weekly-git-summary --help
```

### 项目结构

```bash
weekly-git-summary/
├── scripts/
│   ├── cli.ts                 # CLI 入口点（TypeScript）
│   ├── weekly-git-summary.sh  # Shell 脚本实现
│   ├── weekly-git-summary.ps1 # PowerShell 脚本实现
│   ├── converter.sh           # Git URL 转换工具
│   └── dist/                  # 示例截图
├── tests/
│   ├── cli.test.ts            # CLI 功能测试
│   └── build.test.ts          # 构建系统测试
├── build/                     # 构建输出目录
├── build.ts                   # Bun 构建配置
├── git-log.html              # Web 可视化界面
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 项目文档
```

### 架构设计

该项目采用智能的跨平台架构：

1. **TypeScript CLI 包装器** (`scripts/cli.ts`)

   - 检测操作系统类型
   - 自动选择对应的脚本实现
   - 透明传递命令行参数

2. **平台特定实现**

   - **Windows**: Node.js 脚本 (跨平台兼容)
   - **macOS/Linux**: Bash 脚本或 Node.js 脚本 (回退)
   - 功能完全一致，参数格式统一

3. **构建系统**
   - 使用 Bun 进行 TypeScript 编译
   - 输出 ESM 格式的 Node.js 模块
   - 自动生成可执行的 CLI 工具

## 🧪 测试

项目包含全面的测试套件：

```bash
# 运行所有测试
bun test

# 查看测试覆盖率
bun test --coverage
```

### 测试内容

- **CLI 功能测试** - 验证命令行参数处理、输出格式等
- **构建系统测试** - 验证构建过程和输出文件
- **跨平台兼容性** - 验证不同系统环境下的行为
- **错误处理** - 验证异常情况的处理

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 开发规范

- 使用 TypeScript 进行类型安全的开发
- 遵循 ESLint 和 Prettier 规范
- 为新功能添加相应的测试
- 更新相关文档

## 🔗 相关链接

- [npm 包地址](https://www.npmjs.com/package/weekly-git-summary)
- [GitHub 仓库](https://github.com/user/weekly-git-summary)
- [问题反馈](https://github.com/user/weekly-git-summary/issues)

## 📞 支持

如果您遇到任何问题或有功能建议，请：

1. 查看 [常见问题](docs/FAQ.md)
2. 搜索已有的 [Issues](https://github.com/user/weekly-git-summary/issues)
3. 创建新的 Issue 描述您的问题

---

**喜欢这个项目？请给它一个 ⭐️**
