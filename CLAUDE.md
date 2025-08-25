# CLAUDE.md

该文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

这是 `weekly-git-summary`，一个跨平台的 CLI 工具，用于生成 Git 提交记录的周报汇总。它自动扫描 Git 仓库，提取指定日期范围内的提交历史，并以多种格式输出结果（文本、JSON、Markdown、HTML）。

### 主要特性

- **多维度过滤**: 支持多作者过滤、消息模式匹配（正则表达式）
- **传统提交规范**: 支持 Conventional Commits 解析和统计分析  
- **时间范围预设**: 支持预设时间范围（today, this-week, last-month 等）
- **统计分析**: 提供提交统计、参与者分析、类型分布等
- **国际化文档**: 完整的中英文文档支持

## 关键命令

### 构建和开发

```bash
# 构建 CLI 工具
bun run build.ts

# 构建脚本从 scripts/cli.ts 创建 build/cli.js
# 使用 Bun 的构建 API，ESM 格式，目标为 Node.js
```

### 测试 CLI

```bash
# 构建后，本地测试 CLI
node build/cli.js --help

# 使用参数测试
node build/cli.js -d ~/projects -s 2023-01-01 -u 2023-01-31
node build/cli.js --json
node build/cli.js --md
node build/cli.js --html

# 新功能测试 - 时间范围预设
node build/cli.js --time-range today
node build/cli.js --time-range this-week
node build/cli.js --time-range last-month

# 传统提交规范分析
node build/cli.js --conventional --time-range this-week

# 消息模式过滤（支持正则表达式）
node build/cli.js --message-pattern "feat|fix" --conventional
node build/cli.js --message-pattern "用户|登录|认证"

# 目录路径 - 支持包含空格的路径（多种转义方式）
node build/cli.js -d "Program Files/MyProject"       # 引号包裹
node build/cli.js --dir "My\ Documents/Projects"     # 引号内反斜杠转义
node build/cli.js --dir "/Library/Application\ Support"  # 多个反斜杠转义

# 作者过滤 - 支持多个作者和空格名称（多种转义方式）
node build/cli.js -a "John Doe"                    # 单个作者（引号包裹）
node build/cli.js --author "Zhang San"             # 单个作者（引号包裹）
node build/cli.js --author 'Li Ming Wang'          # 单个作者（单引号包裹）
node build/cli.js -a "John\ Doe"                   # 单个作者（引号内反斜杠转义）
node build/cli.js -a "Alice" -a "Bob"              # 多个作者过滤（OR 关系）
node build/cli.js -a "John Doe" --author "Jane Smith"  # 混合使用短参数和长参数
node build/cli.js -a "Dr\ John\ Doe" -a "Mary\ Jane\ Watson"  # 多个作者反斜杠转义
```

## 架构设计

### 跨平台策略

项目使用 TypeScript CLI 包装器（`scripts/cli.ts`）：

- 使用 `os.platform()` 检测操作系统
- 自动委托给平台特定的脚本：
  - Windows: `weekly-git-summary.js` (Node.js) - 不再依赖 PowerShell
  - macOS/Linux: `weekly-git-summary.sh` (Bash) 或回退到 `weekly-git-summary.js` (Node.js)
- 透明地将所有命令行参数传递给底层脚本

### 核心组件

1. **CLI 入口点** (`scripts/cli.ts`): 平台检测和脚本委托
2. **Node.js 脚本** (`scripts/weekly-git-summary.js`): 跨平台 Node.js 实现，支持所有功能
3. **Shell 脚本** (`scripts/weekly-git-summary.sh`): 独立的 Bash 实现，已集成 URL 转换功能 (仅限 macOS/Linux)
4. **构建脚本** (`build.ts`): 基于 Bun 的构建配置

### 构建系统

- **运行时**: Bun (JavaScript 运行时和包管理器)
- **构建目标**: Node.js ESM 模块
- **输出**: `build/cli.js` (主入口点)
- **TypeScript 配置**: ESNext 目标，严格模式，输出声明文件

## 命令行接口

工具支持以下参数（跨平台一致）：

### 基础参数

- `-d, --dir <path>`: 扫描目录 (默认: 当前目录)
- `-s, --since <date>`: 开始日期 (YYYY-MM-DD 格式，默认: 本周一)
- `-u, --until <date>`: 结束日期 (YYYY-MM-DD 格式，默认: 今天)
- `-a, --author <name>`: 按作者过滤，支持多次使用 (默认: 所有作者)

### 新增功能参数

- `--time-range <preset>`: 使用预设时间范围
  - 支持值: `today`, `yesterday`, `this-week`, `last-week`, `this-month`, `last-month`
- `--message-pattern <pattern>`: 按消息模式过滤，支持正则表达式
- `--conventional`: 启用传统提交规范解析和统计分析

### 输出格式参数

- `-j, --json`: 以 JSON 格式输出
- `--html`: 以 HTML 格式输出  
- `-m, --md`: 以 Markdown 格式输出

### 使用示例

```bash
# 时间范围预设
node build/cli.js --time-range this-week

# 传统提交规范 + 统计分析
node build/cli.js --conventional --time-range this-month

# 消息模式过滤
node build/cli.js --message-pattern "feat|fix|docs"

# 多作者过滤
node build/cli.js -a "John Doe" -a "Jane Smith"

# 组合使用
node build/cli.js --conventional --time-range this-week --message-pattern "feat" --json
```

## 开发说明

### 文件结构

- `scripts/`: 包含所有 CLI 逻辑和平台特定实现
  - `cli.ts`: CLI 入口点，平台检测和脚本委托
  - `weekly-git-summary.ts`: TypeScript/Node.js 实现，跨平台核心逻辑
  - `weekly-git-summary.sh`: Bash 脚本实现（macOS/Linux）
  - `weekly-git-summary.ps1`: PowerShell 脚本实现（Windows）
  - `git-log.html`: HTML 输出模板文件
  - `README.md`: 脚本使用说明和示例
- `docs/`: 项目文档目录（支持中英文双语）
  - `FAQ.md`: 常见问题（英文版）
  - `FAQ.zh.md`: 常见问题（中文版）
  - `RELEASE.md`: 发布管理指南（英文版）
  - `RELEASE.zh.md`: 发布管理指南（中文版）
- `tests/`: 测试文件目录
  - `cli.test.ts`: CLI 功能测试（参数解析、多作者过滤、空格转义等）
  - `integration.test.ts`: 集成测试（构建、输出格式、跨平台兼容性）
  - `windows.test.ts`: Windows 平台专用测试
  - `test-windows-cli.js`: Windows 环境模拟脚本
  - `cli-integration.test.ts`: CLI 集成测试（新功能测试）
  - `new-features.test.ts`: 新功能专项测试
- `build/`: 生成的输出目录 (由构建脚本创建)
- `README.md`: 项目文档（英文版）
- `README.zh.md`: 项目文档（中文版）
- `package.json`: 定义 `weekly-git-summary` 作为二进制入口点
- `tsconfig.json`: TypeScript 配置，目标 ESNext，严格模式

### 平台特定逻辑

Shell 和 Node.js 脚本都实现相同的核心功能：

- 仓库扫描（最大深度 2 层）
- Git 日志提取和日期过滤
- 输出格式化（彩色终端、JSON、Markdown、HTML）
- Git URL 转换（SSH 到 HTTP 格式）

### 新功能实现

#### 传统提交规范支持

- 解析符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范的提交信息
- 支持的提交类型：`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- 自动检测破坏性更改（`BREAKING CHANGE` 或 `feat!`）
- 提供提交类型统计分布

#### 时间范围预设

- 支持预定义时间范围：`today`, `yesterday`, `this-week`, `last-week`, `this-month`, `last-month`
- 自动计算周一到周日的完整周范围
- 准确处理月份边界和闰年

#### 消息模式过滤

- 支持正则表达式模式匹配
- 提供回退机制：如果正则表达式无效，回退到简单字符串匹配
- 支持多种常见模式：类型过滤、关键词匹配、复杂表达式

#### 多作者过滤增强

- 支持同一参数多次使用（OR 关系）
- 智能处理作者名称中的空格
- 支持引号和反斜杠转义

#### 统计分析功能

- 基础统计：总提交数、参与人数、参与者列表
- 类型分布：各种提交类型的数量统计（启用 `--conventional` 时）
- 参与度分析：各个参与者的贡献情况

### 错误处理

CLI 包装器包含全面的错误处理：

- 脚本文件存在性验证
- 跨平台命令执行
- 构建失败时的进程退出代码

## 系统要求

- Node.js ≥ 22.0.0
- Git 命令行工具
- Bun 用于构建
- Windows: Node.js (不再需要 PowerShell)
- macOS/Linux: Bash (用于 .sh 脚本) 或 Node.js (回退选项)

## 文档国际化

项目提供完整的中英文文档支持：

### 双语文档结构

- **README**: `README.md` (英文) / `README.zh.md` (中文)
- **FAQ**: `docs/FAQ.md` (英文) / `docs/FAQ.zh.md` (中文)  
- **发布指南**: `docs/RELEASE.md` (英文) / `docs/RELEASE.zh.md` (中文)

### 语言切换机制

每个文档文件顶部都包含语言切换链接：
- 英文版：`**Language**: [English](FILE.md) | [中文](FILE.zh.md)`
- 中文版：`**语言**: [English](FILE.md) | [中文](FILE.zh.md)`

### 内容一致性

- 中英文版本功能说明保持同步
- 新功能在两个版本中都有详细说明
- 代码示例和使用方法保持一致

### 维护原则

- 英文版作为主版本（符合国际开源惯例）
- 中文版提供本地化内容，便于中文用户理解
- 更新时确保两个版本同步更新

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
