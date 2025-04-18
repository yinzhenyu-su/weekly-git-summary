#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { join, resolve, dirname } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export interface Options {
  help?: boolean
  /**
   * 指定搜索目录
   * @default 当前目录
   * @example /path/to/dir
   */
  dir?: string
  /**
   * 指定开始日期
   * @default 本周一
   * @example 2025-01-01
   */
  since?: string
  /**
   * 指定结束日期
   * @default 今天
   * @example 2025-04-01
   */
  until?: string
  /**
   * 指定作者
   */
  author?: string
  /**
   * 输出JSON格式
   * @default false
   */
  json?: boolean
  /**
   * 输出Markdown格式
   * @default false
   */
  md?: boolean
}

export function parseArgs(): Options {
  const args = process.argv.slice(2)
  const options: Options = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '-d':
      case '--dir':
        if (i + 1 >= args.length) {
          console.error('错误: --dir 参数需要指定目录路径')
          process.exit(1)
        }
        options.dir = args[++i]
        break
      case '-s':
      case '--since':
        if (i + 1 >= args.length) {
          console.error('错误: --since 参数需要指定日期')
          process.exit(1)
        }
        options.since = args[++i]
        break
      case '-u':
      case '--until':
        if (i + 1 >= args.length) {
          console.error('错误: --until 参数需要指定日期')
          process.exit(1)
        }
        options.until = args[++i]
        break
      case '-a':
      case '--author':
        if (i + 1 >= args.length) {
          console.error('错误: --author 参数需要指定作者名称')
          process.exit(1)
        }
        options.author = args[++i]
        break
      case '-j':
      case '--json':
        options.json = true
        break
      case '-m':
      case '--md':
        options.md = true
        break
      case '-h':
      case '--help':
        options.help = true
        break
      default:
        console.error(`错误: 未知参数 "${arg}"`)
        console.log('使用 -h 或 --help 查看帮助信息')
        process.exit(1)
    }
  }

  return options
}

const projectRoot = resolve(process.cwd())
const gitDir = join(projectRoot, '.git')
if (!existsSync(gitDir)) {
  console.error('错误: 当前目录不是一个Git仓库')
  process.exit(1)
}

export function runScript(options: Options) {
  const currentDir = dirname(fileURLToPath(import.meta.url))
  // 如果是 windows 系统，使用 .ps1 脚本
  // 否则使用 .sh 脚本
  const isWindows = process.platform === 'win32'
  const scriptName = isWindows ? 'weekly-git-summary.ps1' : 'weekly-git-summary.sh'
  const scriptPath = join(currentDir, `./scripts/${scriptName}`)
  // 如果是 Windows 系统，检查 PowerShell 是否可用
  if (isWindows) {
    try {
      // 尝试执行 PowerShell 命令检查是否可用
      execSync('powershell -Command "$PSVersionTable.PSVersion"', { stdio: 'ignore' });
    } catch (error) {
      console.error('错误: PowerShell 不可用，请确保已安装 PowerShell 并添加到 PATH 中');
      process.exit(1);
    }
  }
    // 检查 PowerShell 版本
  if (!existsSync(scriptPath)) {
    console.error('错误: 找不到脚本文件:', scriptPath)
    process.exit(1)
  }

  // 安全构建命令参数
  const args: string[] = []
  if (options.help) args.push('--help')
  if (options.dir) args.push(`--dir`, options.dir)
  if (options.since) args.push(`--since`, options.since)
  if (options.until) args.push(`--until`, options.until)
  if (options.author) args.push(`--author`, options.author)
  if (options.json) args.push('--json')
  if (options.md) args.push('--md')

  try {
    console.log('正在执行脚本...')
    const output = execSync(`"${scriptPath}" ${args.join(' ')}`, {
      stdio: 'inherit',
      encoding: 'utf-8'
    })
    return output
  } catch (error) {
    if (error instanceof Error) {
      console.error('错误: 执行脚本失败:', error.message)
    } else {
      console.error('错误: 执行脚本失败:', error)
    }
    process.exit(1)
  }
}

function main() {
  try {
    const options = parseArgs()
    runScript(options)
  } catch (error) {
    if (error instanceof Error) {
      console.error('程序错误:', error.message)
    } else {
      console.error('程序错误:', error)
    }
    process.exit(1)
  }
}

// 如果当前文件是作为脚本执行，则调用 main 函数
if (import.meta.main) {
  // 解析命令行参数
  main()
}