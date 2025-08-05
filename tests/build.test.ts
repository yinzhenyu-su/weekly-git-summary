import { execSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const buildDir = join(process.cwd(), 'build')

describe('Build System Tests', () => {
  it('should build successfully', () => {
    // 清理旧的构建
    if (existsSync(buildDir)) {
      rmSync(buildDir, { recursive: true, force: true })
    }

    // 运行构建
    const result = execSync('bun run build.ts', {
      encoding: 'utf8',
      cwd: process.cwd(),
    })

    expect(result).toContain('CLI 工具构建成功')
    expect(existsSync(buildDir)).toBe(true)
    expect(existsSync(join(buildDir, 'cli.js'))).toBe(true)
  })

  it('should generate executable CLI file', () => {
    // 确保构建存在
    if (!existsSync(buildDir)) {
      execSync('bun run build.ts', { cwd: process.cwd() })
    }

    const cliPath = join(buildDir, 'cli.js')
    expect(existsSync(cliPath)).toBe(true)

    // 验证文件是可执行的
    const result = execSync(`node ${cliPath} --help`, {
      encoding: 'utf8',
      cwd: process.cwd(),
    })

    expect(result).toContain('使用方法')
  })

  it('should have correct shebang', async () => {
    const cliPath = join(buildDir, 'cli.js')
    const content = Bun.file(cliPath)
    const text = await content.text()

    expect(text).toMatch(/^#!/)
    expect(text).toContain('#!/usr/bin/env node')
  })

  it('should include all required imports', async () => {
    const cliPath = join(buildDir, 'cli.js')
    const content = Bun.file(cliPath)
    const text = await content.text()

    expect(text).toContain('execSync')
    expect(text).toContain('platform')
    expect(text).toContain('join')
    expect(text).toContain('existsSync')
  })

  it('should handle rebuild correctly', () => {
    // 首次构建
    execSync('bun run build.ts', { cwd: process.cwd() })
    expect(existsSync(join(buildDir, 'cli.js'))).toBe(true)

    // 重新构建
    const result = execSync('bun run build.ts', {
      encoding: 'utf8',
      cwd: process.cwd(),
    })

    expect(result).toContain('清理构建目录')
    expect(result).toContain('CLI 工具构建成功')
    expect(existsSync(join(buildDir, 'cli.js'))).toBe(true)
  })
})
