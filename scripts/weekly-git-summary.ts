#!/usr/bin/env node
// Node.js 版本的 Git 提交记录汇总工具
import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 颜色定义
const colors = {
  blue: '\x1B[34m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  red: '\x1B[31m',
  reset: '\x1B[0m',
} as const

// 类型定义
export interface Options {
  searchDir: string
  since: string
  until: string
  authors: string[]
  jsonOutput: boolean
  mdOutput: boolean
  htmlOutput: boolean
}

export interface CommitData {
  message: string
  author: string
  hash: string
}

interface DateCommits {
  date: string
  commits: CommitData[]
}

interface RepoData {
  name: string
  url: string
  commits: DateCommits[]
}

interface JsonOutput {
  timeRange: {
    since: string
    until: string
  }
  searchDir: string
  author?: string
  repositories: RepoData[]
}

// 将 Git Remote URL 转换为 HTTP URL 格式
function convertGitRemoteToUrl(remoteInfo: string): string {
  const parts = remoteInfo.split(/\s+/)
  let remoteUrl = parts[1] || ''

  // 检查 URL 是否包含 "git@"，如果是，则转换为 URL 格式，去除 .git 后缀
  if (remoteUrl.startsWith('git@')) {
    // 提取主机名和路径
    const hostPath = remoteUrl
      .replace(/^git@/, '')
      .replace(':', '/')
      .replace(/\.git$/, '')
    remoteUrl = hostPath
  }

  return remoteUrl
}

function getGitRemoteUrl(repoPath: string): string {
  try {
    const remoteInfo
      = execSync('git remote -v', {
        cwd: repoPath,
        encoding: 'utf8',
      }).split('\n')[0] || ''

    return convertGitRemoteToUrl(remoteInfo)
  }
  catch (error) {
    return ''
  }
}

// 生成 HTML 输出函数
function generateHtmlOutput(options: Options): void {
  const templateFile = join(__dirname, 'git-log.html')

  // 检查模板文件是否存在
  if (!existsSync(templateFile)) {
    console.error(
      `${colors.red}错误: 找不到 HTML 模板文件 ${templateFile}${colors.reset}`,
    )
    process.exit(1)
  }

  // 直接生成 JSON 数据而不是递归调用
  const tempOptions: Options = {
    ...options,
    jsonOutput: true,
    htmlOutput: false,
  }

  const jsonOutput = generateJsonOutput(tempOptions)
  const jsonData = JSON.stringify(jsonOutput, null, 2)

  // 读取模板文件内容
  const templateContent = readFileSync(templateFile, 'utf8')

  // 替换模板中的 STATIC_DATA
  const modifiedContent = templateContent.replace(
    'const STATIC_DATA = ``;',
    `const STATIC_DATA = ${jsonData};`,
  )

  console.log(modifiedContent)
}

// 生成 JSON 数据的独立函数
function generateJsonOutput(options: Options): JsonOutput {
  const jsonOutput: JsonOutput = {
    timeRange: {
      since: options.since,
      until: options.until,
    },
    searchDir: options.searchDir,
    repositories: [],
  }

  if (options.authors.length > 0) {
    jsonOutput.author = options.authors.join(', ')
  }

  // 查找所有Git仓库
  const gitRepos = findGitRepositories(options.searchDir)

  for (const repoPath of gitRepos) {
    const repoName = basename(repoPath)
    const repoUrl = getGitRemoteUrl(repoPath)

    // 获取提交日志
    const commits = getGitCommits(
      repoPath,
      options.since,
      options.until,
      options.authors,
    )

    if (commits.length === 0)
      continue

    const repoData: RepoData = {
      name: repoName,
      url: repoUrl,
      commits: [],
    }

    // 按日期分组处理提交
    let currentDate = ''
    let dateCommits: DateCommits | null = null

    for (const line of commits) {
      const parts = line.split('|')
      const date = parts[0] || ''
      const author = parts[1] || ''
      const message = parts[2] || ''
      const hash = parts[3] || ''

      if (date !== currentDate) {
        // 保存之前的日期数据
        if (dateCommits) {
          repoData.commits.push(dateCommits)
        }

        // 创建新的日期组
        currentDate = date
        dateCommits = {
          date,
          commits: [],
        }
      }

      // 添加当前提交
      dateCommits!.commits.push({
        message,
        author,
        hash,
      })
    }

    // 添加最后一个日期组
    if (dateCommits) {
      repoData.commits.push(dateCommits)
    }

    // 添加仓库数据到输出
    jsonOutput.repositories.push(repoData)
  }

  return jsonOutput
}

// 显示帮助信息
function showHelp(): void {
  console.log(`${colors.blue}使用方法:${colors.reset}`)
  console.log('  node weekly-git-summary.js [选项]')
  console.log()
  console.log(`${colors.green}选项:${colors.reset}`)
  console.log('  -h, --help         显示此帮助信息')
  console.log('  -d, --dir DIR      指定搜索目录 (默认: 当前目录)')
  console.log(
    '  -s, --since DATE   指定开始日期 (格式: YYYY-MM-DD, 默认: 本周一)',
  )
  console.log(
    '  -u, --until DATE   指定结束日期 (格式: YYYY-MM-DD, 默认: 今天)',
  )
  console.log('  -a, --author NAME  只显示指定作者的提交')
  console.log('  -j, --json         以JSON格式输出结果')
  console.log('  -m, --md           以Markdown格式输出结果')
  console.log('  --html             生成HTML可视化文件')
  console.log()
  console.log(`${colors.yellow}示例:${colors.reset}`)
  console.log(
    '  node weekly-git-summary.js -d /projects -s 2023-01-01 -u 2023-01-31',
  )
  console.log('  node weekly-git-summary.js -a \'张三\' -s 2023-01-01')
  console.log('  node weekly-git-summary.js -j -s 2023-01-01')
  process.exit(0)
}

// 获取本周一的日期
function getMondayDate(): string {
  const now = new Date()
  const currentWeekday = now.getDay() // 0=周日，1=周一，等等
  const daysToMonday = (currentWeekday + 6) % 7 // 计算到本周一的天数
  const monday = new Date(now.getTime() - daysToMonday * 24 * 60 * 60 * 1000)
  return monday.toISOString().split('T')[0] || ''
}

// 获取今天的日期
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0] || ''
}

// 查找所有Git仓库
function findGitRepositories(
  searchDir: string,
  maxDepth: number = 2,
): string[] {
  const repos: string[] = []

  function searchRecursive(dir: string, depth: number): void {
    if (depth > maxDepth)
      return

    try {
      const items = readdirSync(dir)

      for (const item of items) {
        const fullPath = join(dir, item)

        try {
          const stat = statSync(fullPath)

          if (stat.isDirectory()) {
            if (item === '.git') {
              repos.push(dir)
            }
            else if (depth < maxDepth && !item.startsWith('.')) {
              searchRecursive(fullPath, depth + 1)
            }
          }
        }
        catch (error) {
          // 忽略权限错误等
        }
      }
    }
    catch (error) {
      // 忽略权限错误等
    }
  }

  searchRecursive(searchDir, 0)
  return repos
}

// 清理参数值，去掉多余的引号并处理反斜杠转义
function cleanArgValue(value: string): string {
  if (typeof value !== 'string')
    return value

  let result = value

  // 去掉首尾的单引号或双引号
  if (
    (result.startsWith('"') && result.endsWith('"'))
    || (result.startsWith('\'') && result.endsWith('\''))
  ) {
    result = result.slice(1, -1)
  }

  // 处理反斜杠转义空格：将 "\ " 转换为空格
  result = result.replace(/\\ /g, ' ')

  return result
}

// 解析命令行参数
function parseArgs(args: string[]): Options {
  const options: Options = {
    searchDir: '.',
    since: getMondayDate(),
    until: getTodayDate(),
    authors: [],
    jsonOutput: false,
    mdOutput: false,
    htmlOutput: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '-h':
      case '--help':
        showHelp()
        break
      case '-d':
      case '--dir':
        options.searchDir = cleanArgValue(args[++i] || '.')
        break
      case '-s':
      case '--since':
        options.since = args[++i] || getMondayDate()
        break
      case '-u':
      case '--until':
        options.until = args[++i] || getTodayDate()
        break
      case '-a':
      case '--author':
        const author = cleanArgValue(args[++i] || '')
        if (author) {
          options.authors.push(author)
        }
        break
      case '-j':
      case '--json':
        options.jsonOutput = true
        break
      case '-m':
      case '--md':
        options.mdOutput = true
        break
      case '--html':
        options.htmlOutput = true
        break
      default:
        console.error(`${colors.red}错误: 未知参数 ${arg}${colors.reset}`)
        showHelp()
        process.exit(1)
    }
  }

  return options
}

// 获取Git提交记录
function getGitCommits(
  repoPath: string,
  since: string,
  until: string,
  authors: string[],
): string[] {
  try {
    let gitLogCmd = `git log --since="${since} 00:00:00" --until="${until} 23:59:59" --pretty=format:"%ad|%an|%s|%h" --date=short`

    // 为每个作者添加 --author 参数（OR 关系）
    for (const author of authors) {
      if (author) {
        gitLogCmd += ` --author="${author}"`
      }
    }

    const commits = execSync(gitLogCmd, {
      cwd: repoPath,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)

    return commits
  }
  catch (error) {
    return []
  }
}

// 主函数
export function main(): void {
  const args = process.argv.slice(2)
  const options = parseArgs(args)

  // 检查搜索目录是否存在
  if (!existsSync(options.searchDir)) {
    console.error(
      `${colors.red}错误: 目录 '${options.searchDir}' 不存在${colors.reset}`,
    )
    process.exit(1)
  }

  // 处理不同的输出格式
  if (options.jsonOutput) {
    const jsonOutput = generateJsonOutput(options)
    console.log(JSON.stringify(jsonOutput, null, 2))
    return
  }
  else if (options.htmlOutput) {
    generateHtmlOutput(options)
    return
  }
  else if (options.mdOutput) {
    console.log('# 工作内容Git提交记录汇总')
    console.log('')
    console.log(`- **统计时间范围**: ${options.since} 到 ${options.until}`)
    console.log(`- **搜索目录**: ${options.searchDir}`)
    if (options.authors.length > 0) {
      console.log(`- **作者过滤**: ${options.authors.join(', ')}`)
    }
    console.log('')
  }
  else if (options.htmlOutput) {
    // HTML 输出会在 generateHtmlOutput 函数中处理
  }
  else {
    console.log(
      `${colors.blue}===== 工作内容Git提交记录汇总 =====${colors.reset}`,
    )
    console.log(
      `${colors.green}统计时间范围: ${colors.reset}${options.since} 到 ${options.until}`,
    )
    console.log(`${colors.green}搜索目录: ${colors.reset}${options.searchDir}`)
    if (options.authors.length > 0) {
      console.log(`${colors.green}作者过滤: ${colors.reset}${options.authors.join(', ')}`)
    }
    console.log('')
  }

  // 查找所有Git仓库
  const gitRepos = findGitRepositories(options.searchDir)

  for (const repoPath of gitRepos) {
    const repoName = basename(repoPath)

    // 获取提交日志
    const commits = getGitCommits(
      repoPath,
      options.since,
      options.until,
      options.authors,
    )

    if (commits.length === 0)
      continue

    if (options.mdOutput) {
      console.log('')
      console.log(`## ${repoName}`)
      console.log('')

      // 按日期分组显示提交
      let currentDate = ''
      for (const line of commits) {
        const parts = line.split('|')
        const date = parts[0] || ''
        const author = parts[1] || ''
        const message = parts[2] || ''
        const hash = parts[3] || ''

        if (date !== currentDate) {
          console.log(`### ${date}`)
          currentDate = date
        }
        console.log(`- ${message} (作者: ${author}, hash: ${hash})`)
      }
      console.log('')
    }
    else {
      console.log(`${colors.yellow}项目: ${repoName}${colors.reset}`)
      console.log('')

      // 按日期分组显示提交
      let currentDate = ''
      for (const line of commits) {
        const parts = line.split('|')
        const date = parts[0] || ''
        const author = parts[1] || ''
        const message = parts[2] || ''
        const hash = parts[3] || ''

        if (date !== currentDate) {
          console.log(`${colors.green}${date}${colors.reset}`)
          currentDate = date
        }
        console.log(`  • ${message} (作者: ${author}, hash: ${hash})`)
      }
      console.log('')
      console.log('-----------------------------------------')
      console.log('')
    }
  }

  // 输出最终结果
  if (options.mdOutput) {
    console.log('')
    console.log('---')
    console.log('*工作内容汇总完成*')
  }
  else {
    console.log(`${colors.blue}===== 工作内容汇总完成 =====${colors.reset}`)
  }
}

main()
