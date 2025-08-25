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

// 多语言字符串
const i18n = {
  zh: {
    usage: '使用方法:',
    options: '选项:',
    examples: '示例:',
    help: '显示此帮助信息',
    dir: '指定搜索目录 (默认: 当前目录)',
    since: '指定开始日期 (格式: YYYY-MM-DD, 默认: 本周一)',
    until: '指定结束日期 (格式: YYYY-MM-DD, 默认: 今天)',
    author: '只显示指定作者的提交',
    messagePattern: '过滤符合模式的提交信息 (支持正则表达式)',
    conventional: '启用传统提交规范解析和统计',
    timeRange: '使用预设时间范围 (today, yesterday, this-week, last-week, this-month, last-month)',
    json: '以JSON格式输出结果',
    markdown: '以Markdown格式输出结果',
    html: '生成HTML可视化文件',
    lang: '设置输出语言 (zh|en, 默认: zh)',
    timeRangeLabel: '统计时间范围',
    searchDirLabel: '搜索目录',
    statisticsTitle: '===== 统计信息 =====',
    totalCommits: '总提交数',
    participantCount: '参与人数',
    participants: '参与者',
    commitTypeDistribution: '===== 提交类型分布 =====',
    statisticsMarkdown: '统计信息',
    commitTypeDistributionMarkdown: '提交类型分布',
    times: '次',
    gitCommitSummary: '工作内容Git提交记录汇总',
    feature: '新功能',
    fix: '问题修复',
    docs: '文档更新',
    style: '样式调整',
    refactor: '重构代码',
    perf: '性能优化',
    test: '测试相关',
    build: '构建系统',
    ci: 'CI配置',
    chore: '构建维护',
    revert: '回滚更改',
    other: '其他类型',
    breaking: '破坏性',
  },
  en: {
    usage: 'Usage:',
    options: 'Options:',
    examples: 'Examples:',
    help: 'Show this help message',
    dir: 'Specify search directory (default: current directory)',
    since: 'Specify start date (format: YYYY-MM-DD, default: this Monday)',
    until: 'Specify end date (format: YYYY-MM-DD, default: today)',
    author: 'Show commits by specified author only',
    messagePattern: 'Filter commit messages by pattern (supports regex)',
    conventional: 'Enable conventional commits parsing and statistics',
    timeRange: 'Use preset time range (today, yesterday, this-week, last-week, this-month, last-month)',
    json: 'Output result in JSON format',
    markdown: 'Output result in Markdown format',
    html: 'Generate HTML visualization file',
    lang: 'Set output language (zh|en, default: zh)',
    timeRangeLabel: 'Time Range',
    searchDirLabel: 'Search Directory',
    statisticsTitle: '===== Statistics =====',
    totalCommits: 'Total commits',
    participantCount: 'Participants',
    participants: 'Contributors',
    commitTypeDistribution: '===== Commit Type Distribution =====',
    statisticsMarkdown: 'Statistics',
    commitTypeDistributionMarkdown: 'Commit Type Distribution',
    times: 'times',
    gitCommitSummary: 'Git Commit Summary',
    feature: 'Features',
    fix: 'Fixes',
    docs: 'Documentation',
    style: 'Styling',
    refactor: 'Refactoring',
    perf: 'Performance',
    test: 'Testing',
    build: 'Build',
    ci: 'CI',
    chore: 'Maintenance',
    revert: 'Reverts',
    other: 'Others',
    breaking: 'BREAKING',
  },
} as const

// 获取语言字符串
function t(key: keyof typeof i18n.zh, lang: string = 'zh'): string {
  const language = (lang === 'en' ? 'en' : 'zh') as keyof typeof i18n
  return i18n[language][key]
}

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
  lang: string
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
    'const STATIC_DATA = ``',
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
function showHelp(lang: string = 'zh'): void {
  console.log(`${colors.blue}${t('usage', lang)}${colors.reset}`)
  console.log('  node weekly-git-summary.js [options]')
  console.log()
  console.log(`${colors.green}${t('options', lang)}${colors.reset}`)
  console.log(`  -h, --help                    ${t('help', lang)}`)
  console.log(`  -d, --dir DIR                 ${t('dir', lang)}`)
  console.log(`  -s, --since DATE              ${t('since', lang)}`)
  console.log(`  -u, --until DATE              ${t('until', lang)}`)
  console.log(`  -a, --author NAME             ${t('author', lang)}`)
  console.log(`  --message-pattern PATTERN     ${t('messagePattern', lang)}`)
  console.log(`  --conventional                ${t('conventional', lang)}`)
  console.log(`  --time-range RANGE            ${t('timeRange', lang)}`)
  console.log(`  -j, --json                    ${t('json', lang)}`)
  console.log(`  -m, --md                      ${t('markdown', lang)}`)
  console.log(`  --html                        ${t('html', lang)}`)
  console.log(`  --lang LANG                   ${t('lang', lang)}`)
  console.log()
  console.log(`${colors.yellow}${t('examples', lang)}${colors.reset}`)
  if (lang === 'en') {
    console.log('  node weekly-git-summary.js -d /projects -s 2023-01-01 -u 2023-01-31')
    console.log('  node weekly-git-summary.js -a "John Doe" -s 2023-01-01')
    console.log('  node weekly-git-summary.js --time-range this-week --conventional')
    console.log('  node weekly-git-summary.js --message-pattern "feat|fix" --json')
    console.log('  node weekly-git-summary.js --conventional --time-range last-month --lang en')
  }
  else {
    console.log('  node weekly-git-summary.js -d /projects -s 2023-01-01 -u 2023-01-31')
    console.log('  node weekly-git-summary.js -a \'张三\' -s 2023-01-01')
    console.log('  node weekly-git-summary.js --time-range this-week --conventional')
    console.log('  node weekly-git-summary.js --message-pattern "feat|fix" --json')
    console.log('  node weekly-git-summary.js --conventional --time-range last-month')
  }
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
function getCommitTypeDisplayName(type: string, lang: string = 'zh'): string {
  const typeKey = type as keyof typeof i18n.zh

  // 如果在 i18n 对象中有对应的翻译，使用翻译
  if (typeKey in i18n.zh) {
    return t(typeKey, lang)
  }

  // 对于 other 类型的特殊处理
  if (type === 'other') {
    return t('other', lang)
  }

  // 如果没有翻译，返回原始类型名
  return type
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
    lang: 'zh',
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '-h':
      case '--help':
        // 先检查是否有 --lang 参数
        let helpLang = 'zh'
        for (let j = i + 1; j < args.length; j++) {
          if (args[j] === '--lang' && args[j + 1]) {
            helpLang = args[j + 1] === 'en' ? 'en' : 'zh'
            break
          }
        }
        showHelp(helpLang)
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
            const errorMsg = options.lang === 'en' ? 'Error' : '错误'
            const supportedRangesMsg = options.lang === 'en'
              ? 'Supported time ranges: today, yesterday, this-week, last-week, this-month, last-month'
              : '支持的时间范围: today, yesterday, this-week, last-week, this-month, last-month'
            console.error(`${colors.red}${errorMsg}: ${error.message}${colors.reset}`)
            console.error(`${colors.yellow}${supportedRangesMsg}${colors.reset}`)
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
      case '--lang':
        const lang = args[++i] || 'zh'
        if (lang === 'en' || lang === 'zh') {
          options.lang = lang
        }
        else {
          console.error(`${colors.red}Error: Unsupported language ${lang}, supported languages: zh, en${colors.reset}`)
          process.exit(1)
        }
        break
      default:
        const errorMsg = options.lang === 'en' ? `Error: Unknown argument ${arg}` : `错误: 未知参数 ${arg}`
        console.error(`${colors.red}${errorMsg}${colors.reset}`)
        showHelp(options.lang)
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
    const errorMsg = options.lang === 'en'
      ? `Error: Directory '${options.searchDir}' does not exist`
      : `错误: 目录 '${options.searchDir}' 不存在`
    console.error(`${colors.red}${errorMsg}${colors.reset}`)
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
    console.log(`# ${t('gitCommitSummary', options.lang)}`)
    console.log('')
    const toText = options.lang === 'en' ? 'to' : '到'
    console.log(`- **${t('timeRangeLabel', options.lang)}**: ${options.since} ${toText} ${options.until}`)
    if (options.timeRange) {
      const timeRangePreset = options.lang === 'en' ? 'Time Range Preset' : '时间范围预设'
      console.log(`- **${timeRangePreset}**: ${options.timeRange}`)
    }
    console.log(`- **${t('searchDirLabel', options.lang)}**: ${options.searchDir}`)
    if (options.authors.length > 0) {
      const authorFilter = options.lang === 'en' ? 'Author Filter' : '作者过滤'
      console.log(`- **${authorFilter}**: ${options.authors.join(', ')}`)
    }
    if (options.messagePattern) {
      const messagePattern = options.lang === 'en' ? 'Message Pattern' : '消息模式'
      console.log(`- **${messagePattern}**: ${options.messagePattern}`)
    }
    if (options.conventional) {
      const conventionalCommitsText = options.lang === 'en' ? 'Conventional Commits' : '传统提交规范'
      const enabledText = options.lang === 'en' ? 'Enabled' : '启用'
      console.log(`- **${conventionalCommitsText}**: ${enabledText}`)
    }
    console.log('')
  }
  else if (options.htmlOutput) {
    // HTML 输出会在 generateHtmlOutput 函数中处理
  }
  else {
    const toText = options.lang === 'en' ? 'to' : '到'
    console.log(
      `${colors.blue}===== ${t('gitCommitSummary', options.lang)} =====${colors.reset}`,
    )
    console.log(
      `${colors.green}${t('timeRangeLabel', options.lang)}: ${colors.reset}${options.since} ${toText} ${options.until}`,
    )
    if (options.timeRange) {
      const timeRangePreset = options.lang === 'en' ? 'Time Range Preset' : '时间范围预设'
      console.log(`${colors.green}${timeRangePreset}: ${colors.reset}${options.timeRange}`)
    }
    console.log(`${colors.green}${t('searchDirLabel', options.lang)}: ${colors.reset}${options.searchDir}`)
    if (options.authors.length > 0) {
      const authorFilter = options.lang === 'en' ? 'Author Filter' : '作者过滤'
      console.log(`${colors.green}${authorFilter}: ${colors.reset}${options.authors.join(', ')}`)
    }
    if (options.messagePattern) {
      const messagePattern = options.lang === 'en' ? 'Message Pattern' : '消息模式'
      console.log(`${colors.green}${messagePattern}: ${colors.reset}${options.messagePattern}`)
    }
    if (options.conventional) {
      const conventionalCommitsText = options.lang === 'en' ? 'Conventional Commits' : '传统提交规范'
      const enabledText = options.lang === 'en' ? 'Enabled' : '启用'
      console.log(`${colors.green}${conventionalCommitsText}: ${colors.reset}${enabledText}`)
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
        const authorText = options.lang === 'en' ? 'author' : '作者'
        if (options.conventional) {
          const conventionalInfo = parseConventionalCommit(message)
          if (conventionalInfo) {
            const typeDisplay = getCommitTypeDisplayName(conventionalInfo.type, options.lang)
            const breakingTag = conventionalInfo.breaking ? ` **[${t('breaking', options.lang)}]**` : ''
            console.log(`- **[${typeDisplay}]** ${conventionalInfo.description}${breakingTag} (${authorText}: ${author}, hash: ${hash})`)
          }
          else {
            const otherText = t('other', options.lang)
            console.log(`- **[${otherText}]** ${message} (${authorText}: ${author}, hash: ${hash})`)
          }
        }
        else {
          console.log(`- ${message} (${authorText}: ${author}, hash: ${hash})`)
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
        const authorText = options.lang === 'en' ? 'author' : '作者'
        if (options.conventional) {
          const conventionalInfo = parseConventionalCommit(message)
          if (conventionalInfo) {
            const typeDisplay = getCommitTypeDisplayName(conventionalInfo.type, options.lang)
            const breakingTag = conventionalInfo.breaking ? ` ${colors.red}[${t('breaking', options.lang)}]${colors.reset}` : ''
            console.log(`  • ${colors.blue}[${typeDisplay}]${colors.reset} ${conventionalInfo.description}${breakingTag} (${authorText}: ${author}, hash: ${hash})`)
          }
          else {
            const otherText = t('other', options.lang)
            console.log(`  • ${colors.blue}[${otherText}]${colors.reset} ${message} (${authorText}: ${author}, hash: ${hash})`)
          }
        }
        else {
          console.log(`  • ${message} (${authorText}: ${author}, hash: ${hash})`)
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
      console.log(`## ${t('statisticsMarkdown', options.lang)}`)
      console.log('')
      console.log(`- **${t('totalCommits', options.lang)}**: ${statistics.totalCommits}`)
      console.log(`- **${t('participantCount', options.lang)}**: ${statistics.participantCount}`)
      console.log(`- **${t('participants', options.lang)}**: ${statistics.participants.join(', ')}`)

      if (options.conventional && Object.keys(statistics.typeDistribution).length > 0) {
        console.log('')
        console.log(`### ${t('commitTypeDistributionMarkdown', options.lang)}`)
        console.log('')
        Object.entries(statistics.typeDistribution)
          .sort(([, a], [, b]) => b - a)
          .forEach(([type, count]) => {
            const typeDisplay = getCommitTypeDisplayName(type, options.lang)
            console.log(`- **${typeDisplay}**: ${count} ${t('times', options.lang)}`)
          })
      }
    }
    else {
      console.log(`${colors.blue}${t('statisticsTitle', options.lang)}${colors.reset}`)
      console.log(`${colors.green}${t('totalCommits', options.lang)}: ${colors.reset}${statistics.totalCommits}`)
      console.log(`${colors.green}${t('participantCount', options.lang)}: ${colors.reset}${statistics.participantCount}`)
      console.log(`${colors.green}${t('participants', options.lang)}: ${colors.reset}${statistics.participants.join(', ')}`)

      if (options.conventional && Object.keys(statistics.typeDistribution).length > 0) {
        console.log('')
        console.log(`${colors.blue}${t('commitTypeDistribution', options.lang)}${colors.reset}`)
        Object.entries(statistics.typeDistribution)
          .sort(([, a], [, b]) => b - a)
          .forEach(([type, count]) => {
            const typeDisplay = getCommitTypeDisplayName(type, options.lang)
            console.log(`${colors.green}${typeDisplay}: ${colors.reset}${count} ${t('times', options.lang)}`)
          })
      }
      console.log('')
    }
  }

  // 输出最终结果
  const completedText = options.lang === 'en' ? 'Summary Completed' : '工作内容汇总完成'
  if (options.mdOutput) {
    console.log('')
    console.log('---')
    console.log(`*${completedText}*`)
  }
  else {
    console.log(`${colors.blue}===== ${completedText} =====${colors.reset}`)
  }
}

main()
