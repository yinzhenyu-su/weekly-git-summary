#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
const fs = require('fs');
const path = require('path');

// 颜色定义
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// 命令行参数接口
interface Options {
  dir?: string;
  since?: string;
  until?: string;
  author?: string;
  json?: boolean;
  md?: boolean;
  help?: boolean;
}

// 获取本周一日期
function getMonday(): string {
  const now = new Date();
  const day = now.getDay(); // 0是周日
  const diff = day === 0 ? 6 : day - 1; // 计算到周一的偏移天数
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return formatDate(monday);
}

// 格式化日期为YYYY-MM-DD
function formatDate(date: Date): string {
  const isoString = date.toISOString();
  const datePart = isoString.split('T')[0];
  if (!datePart) {
    throw new Error('日期格式化失败');
  }
  return datePart;
}

// 显示帮助信息
function showHelp(): string {
  const helpText = `${colors.blue}使用方法:${colors.reset}
  weekly-git-summary.ts [选项]

${colors.green}选项:${colors.reset}
  -h, --help         显示此帮助信息
  -d, --dir DIR      指定搜索目录 (默认: 当前目录)
  -s, --since DATE   指定开始日期 (格式: YYYY-MM-DD, 默认: 本周一)
  -u, --until DATE   指定结束日期 (格式: YYYY-MM-DD, 默认: 今天)
  -a, --author NAME  只显示指定作者的提交
  -j, --json         以JSON格式输出结果
  -m, --md           以Markdown格式输出结果

${colors.yellow}示例:${colors.reset}
  weekly-git-summary.ts --dir ~/projects --since 2023-01-01 --until 2023-01-31
  weekly-git-summary.ts --author "张三" --since 2023-01-01
  weekly-git-summary.ts --json --since 2023-01-01`;
  return helpText;
}

// 解析命令行参数
function parseArgs(): Options {
  const options: Options = {
    dir: '.',
    since: getMonday(),
    until: formatDate(new Date()),
    json: false,
    md: false,
    help: false
  };

  const args = process.argv.slice(2);
  console.log(process.argv)
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    console.log(arg)
    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '-d':
      case '--dir':
        if (i + 1 >= args.length) {
          console.error(`${colors.red}错误: 缺少目录参数${colors.reset}`);
          options.help = true;
        }
        options.dir = args[++i]!;
        break;
      case '-s':
      case '--since':
        if (i + 1 >= args.length) {
          console.error(`${colors.red}错误: 缺少开始日期参数${colors.reset}`);
        }
        options.since = args[++i]!;
        break;
      case '-u':
      case '--until':
        if (i + 1 >= args.length) {
          console.error(`${colors.red}错误: 缺少结束日期参数${colors.reset}`);
          options.help = true;
        }
        options.until = args[++i]!;
        break;
      case '-a':
      case '--author':
        options.author = args[++i];
        break;
      case '-j':
      case '--json':
        options.json = true;
        break;
      case '-m':
      case '--md':
        options.md = true;
        break;
      default:
        console.error(`${colors.red}错误: 未知参数 ${arg}${colors.reset}`);
        options.help = true;
    }
  }
  console.log(options)

  return options;
}

// 检查目录是否存在
function checkDir(dir: string): void {
  if (!existsSync(dir)) {
    console.error(`${colors.red}错误: 目录 '${dir}' 不存在${colors.reset}`);
    process.exit(1);
  }
}

// 获取Git仓库列表
// 查找指定目录下的所有Git仓库, 返回.git目录的路径，不递归查找子目录
function findGitRepos(dir: string): string[] {
  const gitDirs: string[] = [];
  // 拼接当前文件的路径和相对路径
  const currentDir = resolve(process.cwd());
  // 拼接当前目录和指定目录
  const dirPath = path.join(currentDir, dir);
  // 检查指定目录是否存在
  if (!fs.existsSync(dirPath)) {
    console.error(`${colors.red}错误: 目录 '${dirPath}' 不存在${colors.reset}`);
    process.exit(1);
  }
  // 读取指定目录下的所有文件和子目录
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    // 检查是否是目录
    if (fs.statSync(filePath).isDirectory()) {
      // 检查是否是Git仓库
      if (filePath.endsWith('.git')) {
        gitDirs.push(filePath);
      }
    }
  }

  return gitDirs;
}

// 获取Git提交记录
function getGitCommits(repoPath: string, options: Options): string {
  const authorFilter = options.author ? `--author="${options.author}"` : '';
  const cmd = `git log ${authorFilter} --since="${options.since} 00:00:00" --until="${options.until} 23:59:59" --pretty=format:"%ad|%an|%s|%h" --date=short`;

  try {
    return execSync(cmd, { cwd: repoPath, encoding: 'utf-8' });
  } catch (error) {
    return '';
  }
}

// 处理并输出结果
function processAndOutput(repos: string[], options: Options): string {
  console.log(options)
  if (options.help) {
    return showHelp();
  } else if (options.json) {
    return outputJson(repos, options);
  } else if (options.md) {
    return outputMarkdown(repos, options);
  } else {
    return outputPlainText(repos, options);
  }
}

// JSON格式输出
function outputJson(repos: string[], options: Options): string {
  let output = '';
  output += '{\n';
  output += '  "timeRange": {\n';
  output += `    "since": "${options.since}",\n`;
  output += `    "until": "${options.until}"\n`;
  output += '  },\n';
  output += `  "searchDir": "${options.dir}",\n`;
  if (options.author) {
    output += `  "author": "${options.author}",\n`;
  }
  output += '  "repositories": [\n';

  let repoCount = 0;
  for (const gitDir of repos) {
    const repoPath = resolve(gitDir, '..');
    const repoName = repoPath.split('/').pop() || '';
    const commits = getGitCommits(repoPath, options);

    if (commits) {
      if (repoCount > 0) {
        output += ',\n';
      }
      repoCount++;

      output += '    {\n';
      output += `      "name": "${repoName}",\n`;
      output += '      "commits": [\n';

      const commitData = processCommitsForJson(commits);
      output += commitData;

      output += '\n      ]\n';
      output += '    }\n';
    }
  }

  output += '\n';
  output += '  ]\n';
  output += '}\n';
  return output;
}

// 处理提交数据为JSON格式
function processCommitsForJson(commits: string): string {
  const lines = commits.split('\n').filter(Boolean);
  let result = '';
  let currentDate = '';
  let firstDate = true;

  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length < 4) continue;

    const [date, author, message, hash] = parts;
    const escapedMessage = message?.replace(/"/g, '\\"') ?? '';

    if (date !== currentDate) {
      if (!firstDate) {
        result += '\n          ]\n        },';
      }
      currentDate = date!;
      result += `\n        {\n          "date": "${date}",\n          "commits": [`;
      firstDate = false;
    } else {
      result += ',';
    }

    result += `\n            {\n              "message": "${escapedMessage}",\n              "author": "${author}",\n              "hash": "${hash}"\n            }`;
  }

  if (!firstDate) {
    result += '\n          ]\n        }';
  } else {
    result = `\n        {\n          "date": "${new Date().toISOString().split('T')[0]}",\n          "commits": []\n        }`;
  }

  return result;
}

// Markdown格式输出
function outputMarkdown(repos: string[], options: Options): string {
  let output = '';
  output += '# 工作内容Git提交记录汇总\n';
  output += '\n';
  output += `- **统计时间范围**: ${options.since} 到 ${options.until}\n`;
  output += `- **搜索目录**: ${options.dir}\n`;
  if (options.author) {
    output += `- **作者过滤**: ${options.author}\n`;
  }
  output += '\n';

  for (const gitDir of repos) {
    const repoPath = resolve(gitDir, '..');
    const repoName = repoPath.split('/').pop() || '';
    const commits = getGitCommits(repoPath, options);

    if (commits) {
      output += '\n';
      output += `## ${repoName}\n`;
      output += '\n';

      let currentDate = '';
      for (const line of commits.split('\n').filter(Boolean)) {
        const parts = line.split('|');
        if (parts.length < 4) continue;

        const [date, author, message, hash] = parts;
        if (date && date !== currentDate) {
          output += `### ${date}\n`;
          currentDate = date!;
        }
        output += `- ${message} (作者: ${author}, hash: ${hash})\n`;
      }
      output += '\n';
    }
  }

  output += '\n';
  output += '---\n';
  output += '*工作内容汇总完成*\n';
  return output;
}

// 普通文本格式输出
function outputPlainText(repos: string[], options: Options): string {
  let output = '';
  output += `${colors.blue}===== 工作内容Git提交记录汇总 =====${colors.reset}\n`;
  output += `${colors.green}统计时间范围:${colors.reset} ${options.since} 到 ${options.until}\n`;
  output += `${colors.green}搜索目录:${colors.reset} ${options.dir}\n`;
  if (options.author) {
    output += `${colors.green}作者过滤:${colors.reset} ${options.author}\n`;
  }
  output += '\n';

  for (const gitDir of repos) {
    const repoPath = resolve(gitDir, '..');
    const repoName = repoPath.split('/').pop() || '';
    const commits = getGitCommits(repoPath, options);

    if (commits) {
      output += `${colors.yellow}项目: ${repoName}${colors.reset}\n`;
      output += '\n';

      let currentDate = '';
      for (const line of commits.split('\n').filter(Boolean)) {
        const parts = line.split('|');
        if (parts.length < 4) continue;

        const [date, author, message, hash] = parts;
        if (date && date !== currentDate) {
          output += `${colors.green}${date}${colors.reset}\n`;
          currentDate = date!;
        }
        output += `  • ${message} (作者: ${author}, hash: ${hash})\n`;
      }

      output += '\n';
      output += '-----------------------------------------\n';
      output += '\n';
    }
  }

  output += `${colors.blue}===== 工作内容汇总完成 =====${colors.reset}\n`;
  return output;
}
const defaultOptions = (options: Options) => ({
  ...options,
  dir: '.',
  since: getMonday(),
  until: formatDate(new Date()),
  json: false,
  md: false,
  help: false
})
// 主函数
function main(options: Options): string {
  const defaultedOptions = defaultOptions(options)
  checkDir(defaultedOptions.dir);
  const gitRepos = findGitRepos(defaultedOptions.dir);
  return processAndOutput(gitRepos, options);
}

export { main }