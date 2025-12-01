# 项目需求文档 (基于 scripts/weekly-git-summary.ts)

## 1. 项目概述
本项目是一个基于 Node.js 的命令行工具 (CLI)，用于自动汇总 Git 提交记录。主要用于生成周报、日报或项目进度报告。支持多仓库扫描、多维度过滤、统计分析以及多种格式输出。

## 2. 核心功能

### 2.1 仓库发现
- **递归搜索**: 支持在指定目录下递归查找所有 Git 仓库（默认深度为 2 层）。
- **忽略**: 自动忽略非 Git 目录。

### 2.2 数据获取
- **Git Log**: 使用 `git log` 命令获取提交历史。
- **远程信息**: 获取仓库的远程 URL (支持 SSH 和 HTTPS 格式转换)。

### 2.3 过滤机制
- **时间范围**:
  - 支持指定开始日期 (`--since`) 和结束日期 (`--until`)。
  - 提供快捷预设 (`--time-range`): `today`, `yesterday`, `this-week`, `last-week`, `this-month`, `last-month`。
  - 默认范围: 本周一至今天。
- **作者**: 支持按作者名称过滤 (`--author`)，支持指定多个作者。
- **提交信息**: 支持通过正则表达式或字符串匹配过滤提交信息 (`--message-pattern`)。

### 2.4 解析与统计
- **常规解析**: 提取提交日期、作者、消息内容、Hash。
- **Conventional Commits 支持**:
  - 启用 (`--conventional`) 后，解析符合 Conventional Commits 规范的提交。
  - 识别类型 (feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert 等)。
  - 识别破坏性变更 (BREAKING CHANGE)。
  - 统计各类型的提交数量。
- **统计指标**:
  - 总提交数。
  - 参与人数及名单。
  - 提交类型分布 (仅在启用 Conventional Commits 时)。

### 2.5 输出格式
- **控制台输出 (Console)**:
  - 默认格式，使用 ANSI 颜色高亮。
  - 显示统计概览、按仓库和日期分组的提交列表。
- **JSON 输出 (`--json`)**:
  - 输出结构化的 JSON 数据，包含所有仓库、提交详情及统计信息。
  - 适合程序二次处理。
- **Markdown 输出 (`--md`)**:
  - 生成 Markdown 格式的报告。
  - 包含统计摘要和详细提交列表。
  - 适合直接复制到文档或笔记中。
- **HTML 输出 (`--html`)**:
  - 生成可视化的 HTML 报告。
  - 依赖外部模板文件 `git-log.html`。

### 2.6 国际化 (i18n)
- 支持中文 (`zh`) 和英文 (`en`)。
- 默认为中文。
- 覆盖帮助信息、统计标题、提交类型描述等。

## 3. 命令行接口 (CLI)

### 3.1 命令格式
`node weekly-git-summary.js [options]`

### 3.2 选项参数
| 选项 (简写/全称) | 描述 | 默认值 |
| :--- | :--- | :--- |
| `-d, --dir` | 指定搜索目录 | 当前目录 (`.`) |
| `-s, --since` | 指定开始日期 (YYYY-MM-DD) | 本周一 |
| `-u, --until` | 指定结束日期 (YYYY-MM-DD) | 今天 |
| `-a, --author` | 只显示指定作者的提交 | 无 (显示所有) |
| `--message-pattern` | 过滤符合模式的提交信息 (支持正则) | 无 |
| `--conventional` | 启用传统提交规范解析和统计 | false |
| `--time-range` | 使用预设时间范围 | 无 |
| `-j, --json` | 以 JSON 格式输出结果 | false |
| `-m, --md` | 以 Markdown 格式输出结果 | false |
| `--html` | 生成 HTML 可视化文件 | false |
| `--lang` | 设置输出语言 (zh/en) | zh |
| `-h, --help` | 显示帮助信息 | - |

## 4. 技术栈
- **Runtime**: Node.js
- **语言**: TypeScript (编译为 JavaScript 执行)
- **依赖**:
  - `node:child_process` (执行 git 命令)
  - `node:fs` (文件系统操作)
  - `node:path` (路径处理)
  - `node:url` (URL 处理)

---

# v2 版本规划 (Finalized)

## 1. 新增需求概述
v2 版本旨在增强工具的灵活性，支持更复杂的项目结构和工作流。
- **多仓库支持**: 允许用户明确指定多个仓库路径，或多个搜索根目录。
- **多分支支持**: 允许用户指定需要统计的分支，不再局限于当前 HEAD。
- **保持兼容**: 必须支持现有的 Console, JSON, MD, HTML 输出格式。

## 2. 功能规范

### 2.1 多仓库支持 (Multi-Repo)
- **指定方式**:
  - **CLI**: 支持多次使用 `-d` 或 `--dir` 参数。
    - 例: `node weekly-git-summary.js -d ./project-a -d ./project-b`
  - **配置文件**: 支持 `git-summary.config.json` (或其他标准配置文件格式)。
    - 配置项: `repositories: string[]`
  - **优先级**: CLI 参数 > 配置文件。如果 CLI 指定了 `-d`，则忽略配置文件中的 `repositories`。

### 2.2 多分支支持 (Multi-Branch)
- **指定方式**:
  - **CLI**: 支持多次使用 `-b` 或 `--branch` 参数。
    - 例: `node weekly-git-summary.js -b main -b develop`
  - **配置文件**: 配置项 `branches: string[]`。
  - **优先级**: CLI 参数 > 配置文件。
- **处理逻辑**:
  - 指定的分支应用于**所有**被扫描到的仓库。
  - **容错处理**: 如果指定了分支 (如 `main`)，但某个仓库不存在该分支，则**跳过该仓库** (或者仅跳过该分支的统计，若该仓库没有任何指定的分支存在，则该仓库不包含在报告中)。
  - **默认行为**: 若未指定分支，则保持原有行为 (统计 HEAD)。

### 2.3 统计与输出逻辑
- **合并模式 (Merge Mode)**:
  - 当指定多个分支时，将所有分支的提交记录合并。
  - **去重**: 保证同一个 Commit Hash 只出现一次 (使用 `git log branch1 branch2` 的默认行为)。
  - **目的**: 生成一份统一的"工作周报"，关注工作内容而非分支拓扑。
- **JSON 结构 (向后兼容)**:
  - 保持 `RepoData` 结构不变。
  - `commits` 数组包含合并后的所有提交。
  - 可选: 在 `JsonOutput` 根节点增加 `branches` 字段记录本次统计涉及的分支配置。

## 2.4 JSON 数据格式 (v2 Specification)

为了支持新特性并保持向后兼容，v2 版本的 JSON 输出将进行如下扩展：

```typescript
interface JsonOutputV2 {
  // --- 新增元数据 ---
  version: string;      // 固定为 "2.0.0"
  generatedAt: string;  // 生成时间 (ISO 8601)

  // --- 配置信息 ---
  config: {
    searchDirs: string[]; // 支持多目录
    branches: string[];   // 支持多分支 (空数组代表 HEAD)
    authors: string[];    // 作者列表
    // 最终使用的绝对时间 (Resolved)
    since: string;
    until: string;
    
    // 用户指定的原始时间配置 (Source)
    // string: 预设值 (e.g., "this-week")
    // object: 手动指定 ({ since: "...", until: "..." })
    timeRange: string | { since: string; until: string }; 
  };

  // --- 统计数据 ---
  statistics: CommitStatistics; // 结构保持不变

  // --- 仓库数据 ---
  repositories: RepoData[];
}

// RepoData 保持不变 (合并模式)
interface RepoData {
  name: string;
  url: string;
  commits: DateCommits[];
}

interface DateCommits {
  date: string;
  commits: CommitData[];
}

interface CommitData {
  message: string;
  author: string;
  hash: string;
  type?: string;
  // 可选: 如果需要区分该提交来自哪个分支，可以增加 refs 字段
  // refs?: string[]; 
}
```

### 变更说明
1.  **Breaking Change**: 移除了顶层的 `searchDir`, `author`, `timeRange` 字段。所有配置信息移入 `config` 对象。
2.  **新增 `version`**: 明确标识数据版本。
3.  **`repositories` 结构不变**: 符合"合并模式"的决策，不按分支嵌套。

## 3. 开发计划
1.  **参数解析升级**: 升级 `parseArgs` 支持数组类型的 `-d` 和 `-b`。
2.  **核心逻辑升级**:
    - 修改 `findGitRepositories` 支持多根目录。
    - 修改 `getGitCommits` 支持多分支参数，并增加分支存在性检查。
3.  **验证与测试**: 确保新功能正常，且旧功能 (单仓库、HEAD) 不受影响。
