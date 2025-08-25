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
  messagePattern?: string
  conventional: boolean
  timeRange?: string
}

export interface CommitData {
  message: string
  author: string
  hash: string
  type?: string // For conventional commits
}

interface ConventionalCommitType {
  type: string
  scope?: string
  description: string
  breaking: boolean
}

interface CommitStatistics {
  totalCommits: number
  participantCount: number
  typeDistribution: Record<string, number>
  participants: string[]
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
  messagePattern?: string
  conventional?: boolean
  statistics?: CommitStatistics
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

  if (options.messagePattern) {
    jsonOutput.messagePattern = options.messagePattern
  }

  if (options.conventional) {
    jsonOutput.conventional = options.conventional
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
      options.messagePattern,
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

      // 处理传统提交信息
      const commitData: CommitData = {
        message,
        author,
        hash,
      }

      if (options.conventional) {
        const conventionalInfo = parseConventionalCommit(message)
        commitData.type = conventionalInfo ? conventionalInfo.type : 'other'
      }

      // 添加当前提交
      dateCommits!.commits.push(commitData)
    }

    // 添加最后一个日期组
    if (dateCommits) {
      repoData.commits.push(dateCommits)
    }

    // 添加仓库数据到输出
    jsonOutput.repositories.push(repoData)
  }

  // 收集统计信息
  const statistics = collectCommitStatistics(jsonOutput.repositories, options.conventional)
  jsonOutput.statistics = statistics

  return jsonOutput
}

// 显示帮助信息
function showHelp(): void {
  console.log(`${colors.blue}使用方法:${colors.reset}`)
  console.log('  node weekly-git-summary.js [选项]')
  console.log()
  console.log(`${colors.green}选项:${colors.reset}`)
  console.log('  -h, --help                    显示此帮助信息')
  console.log('  -d, --dir DIR                 指定搜索目录 (默认: 当前目录)')
  console.log('  -s, --since DATE              指定开始日期 (格式: YYYY-MM-DD, 默认: 本周一)')
  console.log('  -u, --until DATE              指定结束日期 (格式: YYYY-MM-DD, 默认: 今天)')
  console.log('  -a, --author NAME             只显示指定作者的提交')
  console.log('  --message-pattern PATTERN     过滤符合模式的提交信息 (支持正则表达式)')
  console.log('  --conventional                启用传统提交规范解析和统计')
  console.log('  --time-range RANGE            使用预设时间范围 (today, yesterday, this-week, last-week, this-month, last-month)')
  console.log('  -j, --json                    以JSON格式输出结果')
  console.log('  -m, --md                      以Markdown格式输出结果')
  console.log('  --html                        生成HTML可视化文件')
  console.log()
  console.log(`${colors.yellow}示例:${colors.reset}`)
  console.log('  node weekly-git-summary.js -d /projects -s 2023-01-01 -u 2023-01-31')
  console.log('  node weekly-git-summary.js -a \'张三\' -s 2023-01-01')
  console.log('  node weekly-git-summary.js --time-range this-week --conventional')
  console.log('  node weekly-git-summary.js --message-pattern "feat|fix" --json')
  console.log('  node weekly-git-summary.js --conventional --time-range last-month')
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

// 获取昨天的日期
function getYesterdayDate(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0] || ''
}

// 获取本周开始和结束日期
function getThisWeekRange(): { since: string, until: string } {
  const now = new Date()
  const currentWeekday = now.getDay() // 0=周日，1=周一，等等
  const daysToMonday = (currentWeekday + 6) % 7 // 计算到本周一的天数
  const monday = new Date(now.getTime() - daysToMonday * 24 * 60 * 60 * 1000)
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000)

  return {
    since: monday.toISOString().split('T')[0] || '',
    until: sunday.toISOString().split('T')[0] || '',
  }
}

// 获取上周开始和结束日期
function getLastWeekRange(): { since: string, until: string } {
  const thisWeek = getThisWeekRange()
  const lastWeekMonday = new Date(thisWeek.since)
  lastWeekMonday.setDate(lastWeekMonday.getDate() - 7)
  const lastWeekSunday = new Date(thisWeek.until)
  lastWeekSunday.setDate(lastWeekSunday.getDate() - 7)

  return {
    since: lastWeekMonday.toISOString().split('T')[0] || '',
    until: lastWeekSunday.toISOString().split('T')[0] || '',
  }
}

// 获取本月开始和结束日期
function getThisMonthRange(): { since: string, until: string } {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    since: firstDay.toISOString().split('T')[0] || '',
    until: lastDay.toISOString().split('T')[0] || '',
  }
}

// 获取上月开始和结束日期
function getLastMonthRange(): { since: string, until: string } {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)

  return {
    since: firstDay.toISOString().split('T')[0] || '',
    until: lastDay.toISOString().split('T')[0] || '',
  }
}

// 解析传统提交格式
function parseConventionalCommit(message: string): ConventionalCommitType | null {
  // 传统提交格式：type(scope): description
  // 或者 type!: description (表示破坏性更改)
  const conventionalPattern = /^([a-z]+)(\([^)]*\))?(!)?:\s*(.+)/i
  const match = message.match(conventionalPattern)

  if (!match) {
    return null
  }

  const [, type, scopeWithParens, breakingExclamation, description] = match
  const scope = scopeWithParens ? scopeWithParens.slice(1, -1) : undefined
  const breaking = !!breakingExclamation || message.includes('BREAKING CHANGE')

  return {
    type: type!.toLowerCase(),
    scope,
    description: description!.trim(),
    breaking,
  }
}

// 获取提交类型的显示名称
function getCommitTypeDisplayName(type: string): string {
  const typeNames: Record<string, string> = {
    feat: '新功能',
    fix: '修复',
    docs: '文档',
    style: '格式',
    refactor: '重构',
    perf: '性能',
    test: '测试',
    build: '构建',
    ci: 'CI',
    chore: '维护',
    revert: '回滚',
  }

  return typeNames[type] || type
}

// 过滤提交消息
function filterCommitByPattern(message: string, pattern: string): boolean {
  try {
    // 尝试作为正则表达式
    const regex = new RegExp(pattern, 'i')
    return regex.test(message)
  }
  catch (error) {
    // 如果正则表达式无效，回退到简单字符串匹配
    return message.toLowerCase().includes(pattern.toLowerCase())
  }
}

// 解析时间范围预设
function parseTimeRange(timeRange: string): { since: string, until: string } {
  const today = getTodayDate()

  switch (timeRange.toLowerCase()) {
    case 'today':
      return { since: today, until: today }
    case 'yesterday':
      const yesterday = getYesterdayDate()
      return { since: yesterday, until: yesterday }
    case 'this-week':
      return getThisWeekRange()
    case 'last-week':
      return getLastWeekRange()
    case 'this-month':
      return getThisMonthRange()
    case 'last-month':
      return getLastMonthRange()
    default:
      throw new Error(`未知的时间范围预设: ${timeRange}`)
  }
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
    conventional: false,
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
      case '--message-pattern':
        options.messagePattern = args[++i] || ''
        break
      case '--conventional':
        options.conventional = true
        break
      case '--time-range':
        const timeRange = args[++i] || ''
        if (timeRange) {
          try {
            const range = parseTimeRange(timeRange)
            options.since = range.since
            options.until = range.until
            options.timeRange = timeRange
          }
          catch (error: any) {
            console.error(`${colors.red}错误: ${error.message}${colors.reset}`)
            console.error(`${colors.yellow}支持的时间范围: today, yesterday, this-week, last-week, this-month, last-month${colors.reset}`)
            process.exit(1)
          }
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

// 收集提交统计信息
function collectCommitStatistics(repositories: RepoData[], conventional: boolean): CommitStatistics {
  const allCommits: CommitData[] = []
  const participantsSet = new Set<string>()
  const typeDistribution: Record<string, number> = {}

  // 收集所有提交
  for (const repo of repositories) {
    for (const dateGroup of repo.commits) {
      for (const commit of dateGroup.commits) {
        allCommits.push(commit)
        participantsSet.add(commit.author)

        if (conventional) {
          const conventionalInfo = parseConventionalCommit(commit.message)
          const type = conventionalInfo ? conventionalInfo.type : 'other'
          commit.type = type
          typeDistribution[type] = (typeDistribution[type] || 0) + 1
        }
      }
    }
  }

  return {
    totalCommits: allCommits.length,
    participantCount: participantsSet.size,
    typeDistribution,
    participants: Array.from(participantsSet).sort(),
  }
}

// 获取Git提交记录
function getGitCommits(
  repoPath: string,
  since: string,
  until: string,
  authors: string[],
  messagePattern?: string,
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

    // 应用消息模式过滤
    if (messagePattern) {
      return commits.filter((commit) => {
        const parts = commit.split('|')
        const message = parts[2] || ''
        return filterCommitByPattern(message, messagePattern)
      })
    }

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
    if (options.timeRange) {
      console.log(`- **时间范围预设**: ${options.timeRange}`)
    }
    console.log(`- **搜索目录**: ${options.searchDir}`)
    if (options.authors.length > 0) {
      console.log(`- **作者过滤**: ${options.authors.join(', ')}`)
    }
    if (options.messagePattern) {
      console.log(`- **消息模式**: ${options.messagePattern}`)
    }
    if (options.conventional) {
      console.log(`- **传统提交规范**: 启用`)
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
    if (options.timeRange) {
      console.log(`${colors.green}时间范围预设: ${colors.reset}${options.timeRange}`)
    }
    console.log(`${colors.green}搜索目录: ${colors.reset}${options.searchDir}`)
    if (options.authors.length > 0) {
      console.log(`${colors.green}作者过滤: ${colors.reset}${options.authors.join(', ')}`)
    }
    if (options.messagePattern) {
      console.log(`${colors.green}消息模式: ${colors.reset}${options.messagePattern}`)
    }
    if (options.conventional) {
      console.log(`${colors.green}传统提交规范: ${colors.reset}启用`)
    }
    console.log('')
  }

  // 查找所有Git仓库
  const gitRepos = findGitRepositories(options.searchDir)

  // 收集统计信息
  const allRepositories: RepoData[] = []

  for (const repoPath of gitRepos) {
    const repoName = basename(repoPath)

    // 获取提交日志
    const commits = getGitCommits(
      repoPath,
      options.since,
      options.until,
      options.authors,
      options.messagePattern,
    )

    if (commits.length === 0)
      continue

    // 构建仓库数据用于统计
    const repoData: RepoData = {
      name: repoName,
      url: '',
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

      // 处理传统提交信息
      const commitData: CommitData = {
        message,
        author,
        hash,
      }

      if (options.conventional) {
        const conventionalInfo = parseConventionalCommit(message)
        commitData.type = conventionalInfo ? conventionalInfo.type : 'other'
      }

      // 添加当前提交
      dateCommits!.commits.push(commitData)
    }

    // 添加最后一个日期组
    if (dateCommits) {
      repoData.commits.push(dateCommits)
    }

    allRepositories.push(repoData)

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

        // 显示传统提交信息
        if (options.conventional) {
          const conventionalInfo = parseConventionalCommit(message)
          if (conventionalInfo) {
            const typeDisplay = getCommitTypeDisplayName(conventionalInfo.type)
            const breakingTag = conventionalInfo.breaking ? ' **[BREAKING]**' : ''
            console.log(`- **[${typeDisplay}]** ${conventionalInfo.description}${breakingTag} (作者: ${author}, hash: ${hash})`)
          }
          else {
            console.log(`- **[其他]** ${message} (作者: ${author}, hash: ${hash})`)
          }
        }
        else {
          console.log(`- ${message} (作者: ${author}, hash: ${hash})`)
        }
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

        // 显示传统提交信息
        if (options.conventional) {
          const conventionalInfo = parseConventionalCommit(message)
          if (conventionalInfo) {
            const typeDisplay = getCommitTypeDisplayName(conventionalInfo.type)
            const breakingTag = conventionalInfo.breaking ? ` ${colors.red}[BREAKING]${colors.reset}` : ''
            console.log(`  • ${colors.blue}[${typeDisplay}]${colors.reset} ${conventionalInfo.description}${breakingTag} (作者: ${author}, hash: ${hash})`)
          }
          else {
            console.log(`  • ${colors.blue}[其他]${colors.reset} ${message} (作者: ${author}, hash: ${hash})`)
          }
        }
        else {
          console.log(`  • ${message} (作者: ${author}, hash: ${hash})`)
        }
      }
      console.log('')
      console.log('-----------------------------------------')
      console.log('')
    }
  }

  // 收集和显示统计信息
  const statistics = collectCommitStatistics(allRepositories, options.conventional)

  if (statistics.totalCommits > 0) {
    if (options.mdOutput) {
      console.log('')
      console.log('## 统计信息')
      console.log('')
      console.log(`- **总提交数**: ${statistics.totalCommits}`)
      console.log(`- **参与人数**: ${statistics.participantCount}`)
      console.log(`- **参与者**: ${statistics.participants.join(', ')}`)

      if (options.conventional && Object.keys(statistics.typeDistribution).length > 0) {
        console.log('')
        console.log('### 提交类型分布')
        console.log('')
        Object.entries(statistics.typeDistribution)
          .sort(([, a], [, b]) => b - a)
          .forEach(([type, count]) => {
            const typeDisplay = getCommitTypeDisplayName(type)
            console.log(`- **${typeDisplay}**: ${count} 次`)
          })
      }
    }
    else {
      console.log(`${colors.blue}===== 统计信息 =====${colors.reset}`)
      console.log(`${colors.green}总提交数: ${colors.reset}${statistics.totalCommits}`)
      console.log(`${colors.green}参与人数: ${colors.reset}${statistics.participantCount}`)
      console.log(`${colors.green}参与者: ${colors.reset}${statistics.participants.join(', ')}`)

      if (options.conventional && Object.keys(statistics.typeDistribution).length > 0) {
        console.log('')
        console.log(`${colors.blue}===== 提交类型分布 =====${colors.reset}`)
        Object.entries(statistics.typeDistribution)
          .sort(([, a], [, b]) => b - a)
          .forEach(([type, count]) => {
            const typeDisplay = getCommitTypeDisplayName(type)
            console.log(`${colors.green}${typeDisplay}: ${colors.reset}${count} 次`)
          })
      }
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
