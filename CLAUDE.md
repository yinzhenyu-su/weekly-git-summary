# CLAUDE.md

该文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

这是 `weekly-git-summary`，一个跨平台的 CLI 工具，用于生成 Git 提交记录的周报汇总。它自动扫描 Git 仓库，提取指定日期范围内的提交历史，并以多种格式输出结果（文本、JSON、Markdown）。

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

- `-d, --dir <path>`: 扫描目录 (默认: 当前目录)
- `-s, --since <date>`: 开始日期 (YYYY-MM-DD 格式，默认: 本周一)
- `-u, --until <date>`: 结束日期 (YYYY-MM-DD 格式，默认: 今天)
- `-a, --author <name>`: 按作者过滤 (默认: 所有作者)
- `-j, --json`: 以 JSON 格式输出
- `--html`: 以 HTML 格式输出
- `-m, --md`: 以 Markdown 格式输出

## 开发说明

### 文件结构

- `scripts/`: 包含所有 CLI 逻辑和平台特定实现
- `build/`: 生成的输出目录 (由构建脚本创建)
- `package.json`: 定义 `weekly-git-summary` 作为二进制入口点
- `tsconfig.json`: TypeScript 配置，目标 ESNext，严格模式

### 平台特定逻辑

Shell 和 Node.js 脚本都实现相同的核心功能：

- 仓库扫描（最大深度 2 层）
- Git 日志提取和日期过滤
- 输出格式化（彩色终端、JSON、Markdown、HTML）
- Git URL 转换（SSH 到 HTTP 格式）

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
