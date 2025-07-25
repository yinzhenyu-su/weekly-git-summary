#!/usr/bin/env node
// Node.js 版本的 Git 提交记录汇总工具
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 颜色定义
const colors = {
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
} as const;

// 类型定义
export interface Options {
  searchDir: string;
  since: string;
  until: string;
  author: string;
  messagePattern: string;
  conventionalCommits: boolean;
  timeRangePreset: string;
  jsonOutput: boolean;
  mdOutput: boolean;
  htmlOutput: boolean;
}

export interface CommitData {
  message: string;
  author: string;
  hash: string;
  type?: string; // for conventional commits
}

interface DateCommits {
  date: string;
  commits: CommitData[];
}

interface RepoData {
  name: string;
  url: string;
  commits: DateCommits[];
}

interface Statistics {
  totalCommits: number;
  totalAuthors: number;
  commitsByType?: { [key: string]: number };
}

interface JsonOutput {
  timeRange: {
    since: string;
    until: string;
  };
  searchDir: string;
  author?: string;
  messagePattern?: string;
  statistics: Statistics;
  repositories: RepoData[];
}

// 解析传统提交消息类型
function parseConventionalCommitType(message: string): string {
  const match = message.match(/^(\w+)(\(.+\))?\s*:\s*/);
  return match ? match[1] : 'other';
}

// 过滤提交消息
function filterCommitByMessage(message: string, pattern: string): boolean {
  if (!pattern) return true;
  
  try {
    const regex = new RegExp(pattern, 'i');
    return regex.test(message);
  } catch (error) {
    // 如果不是有效的正则表达式，尝试简单的字符串匹配
    return message.toLowerCase().includes(pattern.toLowerCase());
  }
}

// 计算统计信息
function calculateStatistics(repositories: RepoData[], conventionalCommits: boolean): Statistics {
  let totalCommits = 0;
  const authors = new Set<string>();
  const commitsByType: { [key: string]: number } = {};

  repositories.forEach(repo => {
    repo.commits.forEach(dateCommit => {
      dateCommit.commits.forEach(commit => {
        totalCommits++;
        authors.add(commit.author);
        
        if (conventionalCommits && commit.type) {
          commitsByType[commit.type] = (commitsByType[commit.type] || 0) + 1;
        }
      });
    });
  });

  const statistics: Statistics = {
    totalCommits,
    totalAuthors: authors.size,
  };

  if (conventionalCommits && Object.keys(commitsByType).length > 0) {
    statistics.commitsByType = commitsByType;
  }

  return statistics;
}

// 将 Git Remote URL 转换为 HTTP URL 格式
function convertGitRemoteToUrl(remoteInfo: string): string {
  const parts = remoteInfo.split(/\s+/);
  let remoteUrl = parts[1] || "";

  // 检查 URL 是否包含 "git@"，如果是，则转换为 URL 格式，去除 .git 后缀
  if (remoteUrl.startsWith("git@")) {
    // 提取主机名和路径
    const hostPath = remoteUrl
      .replace(/^git@/, "")
      .replace(":", "/")
      .replace(/\.git$/, "");
    remoteUrl = hostPath;
  }

  return remoteUrl;
}

function getGitRemoteUrl(repoPath: string): string {
  try {
    const remoteInfo =
      execSync("git remote -v", {
        cwd: repoPath,
        encoding: "utf8",
      }).split("\n")[0] || "";

    return convertGitRemoteToUrl(remoteInfo);
  } catch (error) {
    return "";
  }
}

// 生成 HTML 输出函数
function generateHtmlOutput(options: Options): void {
  const templateFile = join(__dirname, "git-log.html");

  // 检查模板文件是否存在
  if (!existsSync(templateFile)) {
    console.error(
      `${colors.red}错误: 找不到 HTML 模板文件 ${templateFile}${colors.reset}`
    );
    process.exit(1);
  }

  // 直接生成 JSON 数据而不是递归调用
  const tempOptions: Options = {
    ...options,
    jsonOutput: true,
    htmlOutput: false,
  };

  const jsonOutput = generateJsonOutput(tempOptions);
  const jsonData = JSON.stringify(jsonOutput, null, 2);

  // 读取模板文件内容
  const templateContent = readFileSync(templateFile, "utf8");

  // 替换模板中的 STATIC_DATA
  const modifiedContent = templateContent.replace(
    "const STATIC_DATA = ``;",
    `const STATIC_DATA = ${jsonData};`
  );

  console.log(modifiedContent);
}

// 生成 JSON 数据的独立函数
function generateJsonOutput(options: Options): JsonOutput {
  const jsonOutput: JsonOutput = {
    timeRange: {
      since: options.since,
      until: options.until,
    },
    searchDir: options.searchDir,
    statistics: {
      totalCommits: 0,
      totalAuthors: 0,
    },
    repositories: [],
  };

  if (options.author) {
    jsonOutput.author = options.author;
  }
  
  if (options.messagePattern) {
    jsonOutput.messagePattern = options.messagePattern;
  }

  // 查找所有Git仓库
  const gitRepos = findGitRepositories(options.searchDir);

  for (const repoPath of gitRepos) {
    const repoName = basename(repoPath);
    const repoUrl = getGitRemoteUrl(repoPath);

    // 获取提交日志
    const commits = getGitCommits(
      repoPath,
      options.since,
      options.until,
      options.author,
      options.messagePattern,
      options.conventionalCommits
    );

    if (commits.length === 0) continue;

    const repoData: RepoData = {
      name: repoName,
      url: repoUrl,
      commits: [],
    };

    // 按日期分组处理提交
    const commitsByDate = new Map<string, CommitData[]>();
    
    commits.forEach(({ date, commit }) => {
      if (!commitsByDate.has(date)) {
        commitsByDate.set(date, []);
      }
      
      commitsByDate.get(date)!.push(commit);
    });

    // 转换为所需格式，按日期排序
    const sortedDates = Array.from(commitsByDate.keys()).sort().reverse();
    for (const date of sortedDates) {
      const dateCommits = commitsByDate.get(date)!;
      repoData.commits.push({
        date,
        commits: dateCommits,
      });
    }

    // 添加仓库数据到输出
    jsonOutput.repositories.push(repoData);
  }

  // 计算统计信息
  jsonOutput.statistics = calculateStatistics(jsonOutput.repositories, options.conventionalCommits);

  return jsonOutput;
}

// 显示帮助信息
function showHelp(): void {
  console.log(`${colors.blue}使用方法:${colors.reset}`);
  console.log("  node weekly-git-summary.js [选项]");
  console.log();
  console.log(`${colors.green}选项:${colors.reset}`);
  console.log("  -h, --help         显示此帮助信息");
  console.log("  -d, --dir DIR      指定搜索目录 (默认: 当前目录)");
  console.log(
    "  -s, --since DATE   指定开始日期 (格式: YYYY-MM-DD, 默认: 本周一)"
  );
  console.log(
    "  -u, --until DATE   指定结束日期 (格式: YYYY-MM-DD, 默认: 今天)"
  );
  console.log("  -a, --author NAME  只显示指定作者的提交");
  console.log("  --message-pattern PATTERN  按提交信息模式过滤 (支持正则表达式)");
  console.log("  --conventional     启用传统提交格式解析和分组");
  console.log("  --time-range PRESET  使用时间范围预设");
  console.log("                     可选值: today, yesterday, this-week, last-week, this-month, last-month");
  console.log("  -j, --json         以JSON格式输出结果");
  console.log("  -m, --md           以Markdown格式输出结果");
  console.log("  --html             生成HTML可视化文件");
  console.log();
  console.log(`${colors.yellow}示例:${colors.reset}`);
  console.log(
    "  node weekly-git-summary.js -d /projects -s 2023-01-01 -u 2023-01-31"
  );
  console.log("  node weekly-git-summary.js -a '张三' --time-range last-week");
  console.log("  node weekly-git-summary.js --message-pattern '^feat|^fix'");
  console.log("  node weekly-git-summary.js --conventional --time-range this-month --json");
  process.exit(0);
}

// 获取本周一的日期
function getMondayDate(): string {
  const now = new Date();
  const currentWeekday = now.getDay(); // 0=周日，1=周一，等等
  const daysToMonday = (currentWeekday + 6) % 7; // 计算到本周一的天数
  const monday = new Date(now.getTime() - daysToMonday * 24 * 60 * 60 * 1000);
  return monday.toISOString().split("T")[0] || "";
}

// 获取今天的日期
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0] || "";
}

// 获取时间范围预设
function getTimeRangePreset(preset: string): { since: string, until: string } {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  
  switch (preset) {
    case 'today':
      return { since: today, until: today };
    
    case 'yesterday': {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      return { since: yesterdayStr, until: yesterdayStr };
    }
    
    case 'this-week': {
      const currentWeekday = now.getDay();
      const daysToMonday = (currentWeekday + 6) % 7;
      const monday = new Date(now.getTime() - daysToMonday * 24 * 60 * 60 * 1000);
      const mondayStr = monday.toISOString().split("T")[0];
      return { since: mondayStr, until: today };
    }
    
    case 'last-week': {
      const currentWeekday = now.getDay();
      const daysToLastMonday = (currentWeekday + 6) % 7 + 7;
      const lastMonday = new Date(now.getTime() - daysToLastMonday * 24 * 60 * 60 * 1000);
      const lastSunday = new Date(lastMonday.getTime() + 6 * 24 * 60 * 60 * 1000);
      return { 
        since: lastMonday.toISOString().split("T")[0], 
        until: lastSunday.toISOString().split("T")[0] 
      };
    }
    
    case 'this-month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { 
        since: firstDay.toISOString().split("T")[0], 
        until: today 
      };
    }
    
    case 'last-month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { 
        since: firstDay.toISOString().split("T")[0], 
        until: lastDay.toISOString().split("T")[0] 
      };
    }
    
    default:
      return { since: getMondayDate(), until: today };
  }
}

// 查找所有Git仓库
function findGitRepositories(
  searchDir: string,
  maxDepth: number = 2
): string[] {
  const repos: string[] = [];

  function searchRecursive(dir: string, depth: number): void {
    if (depth > maxDepth) return;

    try {
      const items = readdirSync(dir);

      for (const item of items) {
        const fullPath = join(dir, item);

        try {
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            if (item === ".git") {
              repos.push(dir);
            } else if (depth < maxDepth && !item.startsWith(".")) {
              searchRecursive(fullPath, depth + 1);
            }
          }
        } catch (error) {
          // 忽略权限错误等
        }
      }
    } catch (error) {
      // 忽略权限错误等
    }
  }

  searchRecursive(searchDir, 0);
  return repos;
}

// 清理参数值，去掉多余的引号
function cleanArgValue(value: string): string {
  if (typeof value !== "string") return value;

  // 去掉首尾的单引号或双引号
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

// 解析命令行参数
function parseArgs(args: string[]): Options {
  const options: Options = {
    searchDir: ".",
    since: getMondayDate(),
    until: getTodayDate(),
    author: "",
    messagePattern: "",
    conventionalCommits: false,
    timeRangePreset: "",
    jsonOutput: false,
    mdOutput: false,
    htmlOutput: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "-h":
      case "--help":
        showHelp();
        break;
      case "-d":
      case "--dir":
        options.searchDir = args[++i] || ".";
        break;
      case "-s":
      case "--since":
        options.since = args[++i] || getMondayDate();
        break;
      case "-u":
      case "--until":
        options.until = args[++i] || getTodayDate();
        break;
      case "-a":
      case "--author":
        options.author = cleanArgValue(args[++i] || "");
        break;
      case "--message-pattern":
        options.messagePattern = cleanArgValue(args[++i] || "");
        break;
      case "--conventional":
        options.conventionalCommits = true;
        break;
      case "--time-range":
        options.timeRangePreset = args[++i] || "";
        break;
      case "-j":
      case "--json":
        options.jsonOutput = true;
        break;
      case "-m":
      case "--md":
        options.mdOutput = true;
        break;
      case "--html":
        options.htmlOutput = true;
        break;
      default:
        console.error(`${colors.red}错误: 未知参数 ${arg}${colors.reset}`);
        showHelp();
        process.exit(1);
    }
  }

  // 如果指定了时间范围预设，覆盖since和until
  if (options.timeRangePreset) {
    const { since, until } = getTimeRangePreset(options.timeRangePreset);
    options.since = since;
    options.until = until;
  }

  return options;
}

// 获取Git提交记录
function getGitCommits(
  repoPath: string,
  since: string,
  until: string,
  author: string,
  messagePattern: string,
  conventionalCommits: boolean
): { date: string, commit: CommitData }[] {
  try {
    let gitLogCmd = `git log --since="${since} 00:00:00" --until="${until} 23:59:59" --pretty=format:"%ad|%an|%s|%h" --date=short`;

    if (author) {
      gitLogCmd += ` --author="${author}"`;
    }

    const commits = execSync(gitLogCmd, {
      cwd: repoPath,
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean)
      .map(line => {
        const parts = line.split("|");
        if (parts.length >= 4) {
          const [date, author, message, hash] = parts;
          const commit: CommitData = { message, author, hash };
          
          if (conventionalCommits) {
            commit.type = parseConventionalCommitType(message);
          }
          
          return { date, commit };
        }
        return null;
      })
      .filter((item): item is { date: string, commit: CommitData } => item !== null)
      .filter(item => filterCommitByMessage(item.commit.message, messagePattern));

    return commits;
  } catch (error) {
    return [];
  }
}

// 主函数
export function main(): void {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  // 检查搜索目录是否存在
  if (!existsSync(options.searchDir)) {
    console.error(
      `${colors.red}错误: 目录 '${options.searchDir}' 不存在${colors.reset}`
    );
    process.exit(1);
  }

  // 处理不同的输出格式
  if (options.jsonOutput) {
    const jsonOutput = generateJsonOutput(options);
    console.log(JSON.stringify(jsonOutput, null, 2));
    return;
  } else if (options.htmlOutput) {
    generateHtmlOutput(options);
    return;
  } else if (options.mdOutput) {
    console.log("# 工作内容Git提交记录汇总");
    console.log("");
    console.log(`- **统计时间范围**: ${options.since} 到 ${options.until}`);
    console.log(`- **搜索目录**: ${options.searchDir}`);
    if (options.author) {
      console.log(`- **作者过滤**: ${options.author}`);
    }
    console.log("");
  } else if (options.htmlOutput) {
    // HTML 输出会在 generateHtmlOutput 函数中处理
  } else {
    console.log(
      `${colors.blue}===== 工作内容Git提交记录汇总 =====${colors.reset}`
    );
    console.log(
      `${colors.green}统计时间范围: ${colors.reset}${options.since} 到 ${options.until}`
    );
    console.log(`${colors.green}搜索目录: ${colors.reset}${options.searchDir}`);
    if (options.author) {
      console.log(`${colors.green}作者过滤: ${colors.reset}${options.author}`);
    }
    console.log("");
  }

  // 查找所有Git仓库
  const gitRepos = findGitRepositories(options.searchDir);

  for (const repoPath of gitRepos) {
    const repoName = basename(repoPath);

    // 获取提交日志
    const commits = getGitCommits(
      repoPath,
      options.since,
      options.until,
      options.author,
      options.messagePattern,
      options.conventionalCommits
    );

    if (commits.length === 0) continue;

    if (options.mdOutput) {
      console.log("");
      console.log(`## ${repoName}`);
      console.log("");

      // 按日期分组显示提交
      const commitsByDate = new Map<string, typeof commits>();
      
      commits.forEach(({ date, commit }) => {
        if (!commitsByDate.has(date)) {
          commitsByDate.set(date, []);
        }
        commitsByDate.get(date)!.push({ date, commit });
      });

      const sortedDates = Array.from(commitsByDate.keys()).sort().reverse();
      for (const date of sortedDates) {
        console.log(`### ${date}`);
        const dateCommits = commitsByDate.get(date)!;
        dateCommits.forEach(({ commit }) => {
          let commitLine = `- ${commit.message} (作者: ${commit.author}, hash: ${commit.hash})`;
          if (options.conventionalCommits && commit.type) {
            commitLine = `- [${commit.type}] ${commit.message} (作者: ${commit.author}, hash: ${commit.hash})`;
          }
          console.log(commitLine);
        });
      }
      console.log("");
    } else {
      console.log(`${colors.yellow}项目: ${repoName}${colors.reset}`);
      console.log("");

      // 按日期分组显示提交
      const commitsByDate = new Map<string, typeof commits>();
      
      commits.forEach(({ date, commit }) => {
        if (!commitsByDate.has(date)) {
          commitsByDate.set(date, []);
        }
        commitsByDate.get(date)!.push({ date, commit });
      });

      const sortedDates = Array.from(commitsByDate.keys()).sort().reverse();
      for (const date of sortedDates) {
        console.log(`${colors.green}${date}${colors.reset}`);
        const dateCommits = commitsByDate.get(date)!;
        dateCommits.forEach(({ commit }) => {
          let commitLine = `  • ${commit.message} (作者: ${commit.author}, hash: ${commit.hash})`;
          if (options.conventionalCommits && commit.type) {
            commitLine = `  • [${commit.type}] ${commit.message} (作者: ${commit.author}, hash: ${commit.hash})`;
          }
          console.log(commitLine);
        });
      }
      console.log("");
      console.log("-----------------------------------------");
      console.log("");
    }
  }

  // 计算并显示统计信息
  const allCommits: { date: string, commit: CommitData }[] = [];
  
  // 重新收集提交数据用于统计
  for (const repoPath of gitRepos) {
    const commits = getGitCommits(
      repoPath,
      options.since,
      options.until,
      options.author,
      options.messagePattern,
      options.conventionalCommits
    );
    allCommits.push(...commits);
  }

  if (allCommits.length > 0) {
    const uniqueAuthors = new Set(allCommits.map(({ commit }) => commit.author));
    const commitsByType: { [key: string]: number } = {};
    
    if (options.conventionalCommits) {
      allCommits.forEach(({ commit }) => {
        if (commit.type) {
          commitsByType[commit.type] = (commitsByType[commit.type] || 0) + 1;
        }
      });
    }

    if (options.mdOutput) {
      console.log("## 统计信息");
      console.log(`- **总提交数**: ${allCommits.length}`);
      console.log(`- **参与作者数**: ${uniqueAuthors.size}`);
      if (options.conventionalCommits && Object.keys(commitsByType).length > 0) {
        console.log("- **提交类型分布**:");
        Object.entries(commitsByType)
          .sort(([,a], [,b]) => b - a)
          .forEach(([type, count]) => {
            console.log(`  - ${type}: ${count}`);
          });
      }
      console.log("");
    } else {
      console.log(`${colors.green}统计信息:${colors.reset}`);
      console.log(`  总提交数: ${allCommits.length}`);
      console.log(`  参与作者数: ${uniqueAuthors.size}`);
      if (options.conventionalCommits && Object.keys(commitsByType).length > 0) {
        console.log("  提交类型分布:");
        Object.entries(commitsByType)
          .sort(([,a], [,b]) => b - a)
          .forEach(([type, count]) => {
            console.log(`    ${type}: ${count}`);
          });
      }
      console.log("");
    }
  }

  // 输出最终结果
  if (options.mdOutput) {
    console.log("");
    console.log("---");
    console.log("*工作内容汇总完成*");
  } else {
    console.log(`${colors.blue}===== 工作内容汇总完成 =====${colors.reset}`);
  }
}

main();
