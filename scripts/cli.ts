#!/usr/bin/env node
// 跨平台 Git 提交记录汇总工具 - 统一使用 Node.js 实现
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { platform } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function main() {
  const args = process.argv.slice(2)
  const currentPlatform = platform()

  // 构建参数字符串，正确处理包含空格的参数
  const argsString = args.map((arg) => {
    // 如果参数已经被引号包裹，不处理
    if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith('\'') && arg.endsWith('\''))) {
      return arg
    }
    // 如果参数包含反斜杠转义空格，认为用户已转义，不添加引号
    if (arg.includes('\\ ')) {
      return arg
    }
    // 如果参数包含普通空格，添加引号
    if (arg.includes(' ')) {
      return `"${arg}"`
    }
    return arg
  }).join(' ')

  let scriptPath: string
  let command: string

  if (currentPlatform === 'win32') {
    // Windows 系统使用 TypeScript 脚本（编译后的 JS）
    scriptPath = join(__dirname, 'weekly-git-summary.js')
    command = `node "${scriptPath}" ${argsString}`
  }
  else {
    // macOS/Linux 系统优先使用 Shell 脚本，回退到 TypeScript 脚本
    const shScriptPath = join(__dirname, 'weekly-git-summary.sh')
    const tsScriptPath = join(__dirname, 'weekly-git-summary.js')

    if (existsSync(shScriptPath)) {
      scriptPath = shScriptPath
      command = `bash "${scriptPath}" ${argsString}`
    }
    else {
      scriptPath = tsScriptPath
      command = `node "${scriptPath}" ${argsString}`
    }
  }

  // 检查脚本文件是否存在
  if (!existsSync(scriptPath)) {
    console.error(`错误: 找不到脚本文件 ${scriptPath}`)
    process.exit(1)
  }

  try {
    // 执行对应的脚本
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
  }
  catch (error) {
    console.error('脚本执行失败:', error)
    process.exit(1)
  }
}

main()
