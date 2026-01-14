import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'bun'

const buildDir = './build'
const scriptsDir = './scripts'

async function buildCli() {
  console.log('🏗️  开始构建 CLI 工具...')

  // 清理构建目录
  if (existsSync(buildDir)) {
    rmSync(buildDir, { recursive: true, force: true })
    console.log('🧹 清理构建目录')
  }

  // 创建构建目录
  mkdirSync(buildDir, { recursive: true })

  try {
    // 构建 CLI 入口文件
    const result = await build({
      entrypoints: [
        join(scriptsDir, 'cli.ts'),
        join(scriptsDir, 'weekly-git-summary.ts'),
      ],
      outdir: buildDir,
      target: 'node',
      format: 'esm',
      sourcemap: 'none',
      external: [],
      naming: {
        entry: '[dir]/[name].[ext]',
      },
    })

    if (result.success) {
      // 复制脚本文件到构建目录
      const shScriptPath = join(scriptsDir, 'weekly-git-summary.sh')
      const ps1ScriptPath = join(scriptsDir, 'weekly-git-summary.ps1')
      const htmlTemplatePath = join(scriptsDir, 'git-log.html')
      const htmlTemplateEnPath = join(scriptsDir, 'git-log.en.html')

      if (existsSync(shScriptPath)) {
        copyFileSync(shScriptPath, join(buildDir, 'weekly-git-summary.sh'))
        console.log('📄 复制 Shell 脚本文件')
      }

      if (existsSync(ps1ScriptPath)) {
        copyFileSync(ps1ScriptPath, join(buildDir, 'weekly-git-summary.ps1'))
        console.log('📄 复制 PowerShell 脚本文件')
      }

      if (existsSync(htmlTemplatePath)) {
        copyFileSync(htmlTemplatePath, join(buildDir, 'git-log.html'))
        console.log('📄 复制 HTML 模板文件')
      }

      if (existsSync(htmlTemplateEnPath)) {
        copyFileSync(htmlTemplateEnPath, join(buildDir, 'git-log.en.html'))
        console.log('📄 复制英文版 HTML 模板文件')
      }

      console.log('✅ CLI 工具构建成功')
      console.log(`📦 输出目录: ${buildDir}`)
      console.log(`🎯 CLI 入口文件: ${buildDir}/cli.js`)
    }
    else {
      console.error('❌ 构建失败')
      if (!result.success) {
        console.error('CLI 构建失败:')
        for (const log of result.logs) {
          console.error(log)
        }
      }
    }
  }
  catch (error) {
    console.error('❌ 构建过程中发生错误:', error)
    process.exit(1)
  }
}

// 执行构建
buildCli().catch(console.error)
