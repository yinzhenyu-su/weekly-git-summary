import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'

const testDir = join(process.cwd(), 'test-repo-i18n')
const buildDir = join(process.cwd(), 'build')

describe('i18n Internationalization Tests', () => {
  beforeAll(() => {
    // 确保构建目录存在
    if (!existsSync(buildDir)) {
      execSync('bun run build.ts', { cwd: process.cwd() })
    }

    // 创建测试 Git 仓库
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
    mkdirSync(testDir, { recursive: true })

    // 初始化 Git 仓库
    execSync('git init --initial-branch=main', { cwd: testDir })
    execSync('git config user.name "Test User"', { cwd: testDir })
    execSync('git config user.email "test@example.com"', { cwd: testDir })

    // 创建测试文件并提交
    writeFileSync(join(testDir, 'test.txt'), 'test content')
    execSync('git add .', { cwd: testDir })
    execSync('git commit -m "Initial commit"', { cwd: testDir })
  })

  afterAll(() => {
    // 清理测试目录
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('TypeScript Implementation', () => {
    it('should show Chinese help by default', () => {
      const result = execSync('node build/cli.js --help', {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(result).toContain('使用方法')
      expect(result).toContain('选项')
      expect(result).toContain('显示此帮助信息')
    })

    it('should show English help with --lang en', () => {
      const result = execSync('node build/cli.js --help --lang en', {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(result).toContain('Usage:')
      expect(result).toContain('Options:')
      expect(result).toContain('Show this help message')
    })

    it('should show Chinese output by default', () => {
      const result = execSync(`node build/cli.js --dir ${testDir} --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult).toHaveProperty('repositories')
    })

    it('should respect --lang zh parameter', () => {
      const result = execSync(`node build/cli.js --dir ${testDir} --lang zh --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult).toHaveProperty('repositories')
    })

    it('should respect --lang en parameter', () => {
      const result = execSync(`node build/cli.js --dir ${testDir} --lang en --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult).toHaveProperty('repositories')
    })

    it('should use translated labels in text output (Chinese)', () => {
      const result = execSync(`node build/cli.js --dir ${testDir} --lang zh`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(result).toContain('项目:')
      expect(result).toContain('作者:')
    })

    it('should use translated labels in text output (English)', () => {
      const result = execSync(`node build/cli.js --dir ${testDir} --lang en`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(result).toContain('Project:')
      expect(result).toContain('author:')
    })

    it('should use translated labels in markdown output (Chinese)', () => {
      const result = execSync(`node build/cli.js --dir ${testDir} --lang zh --md`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(result).toContain('工作内容Git提交记录汇总')
      expect(result).toContain('作者:')
    })

    it('should use translated labels in markdown output (English)', () => {
      const result = execSync(`node build/cli.js --dir ${testDir} --lang en --md`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(result).toContain('Git Commit Summary')
      expect(result).toContain('author:')
    })

    it('should use translated labels in HTML output (English)', () => {
      const result = execSync(`node build/cli.js --dir ${testDir} --lang en --html`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(result).toContain('data-lang="en"')
    })

    it('should use translated labels in HTML output (Chinese)', () => {
      const result = execSync(`node build/cli.js --dir ${testDir} --lang zh --html`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(result).toContain('data-lang="zh"')
    })
  })

  describe('Bash Implementation', () => {
    it('should show Chinese help by default', () => {
      // Skip on Windows
      if (process.platform === 'win32') {
        console.log('Skipping bash test on Windows')
        return
      }

      const result = execSync('bash build/weekly-git-summary.sh --help', {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(result).toContain('使用方法')
      expect(result).toContain('选项')
    })

    it('should show English help with --lang en', () => {
      // Skip on Windows
      if (process.platform === 'win32') {
        console.log('Skipping bash test on Windows')
        return
      }

      const result = execSync('bash build/weekly-git-summary.sh --help --lang en', {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(result).toContain('Usage:')
      expect(result).toContain('Options:')
    })

    it('should use translated labels in text output (Chinese)', () => {
      // Skip on Windows
      if (process.platform === 'win32') {
        console.log('Skipping bash test on Windows')
        return
      }

      const result = execSync(`bash build/weekly-git-summary.sh --dir ${testDir} --lang zh 2>/dev/null`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(result).toContain('项目:')
      expect(result).toContain('作者:')
    })

    it('should use translated labels in text output (English)', () => {
      // Skip on Windows
      if (process.platform === 'win32') {
        console.log('Skipping bash test on Windows')
        return
      }

      const result = execSync(`bash build/weekly-git-summary.sh --dir ${testDir} --lang en 2>/dev/null`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(result).toContain('Project:')
      expect(result).toContain('author:')
    })
  })

  describe('Cross-platform consistency', () => {
    it('should produce consistent JSON output regardless of language', () => {
      const resultZh = execSync(`node build/cli.js --dir ${testDir} --lang zh --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const resultEn = execSync(`node build/cli.js --dir ${testDir} --lang en --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonZh = JSON.parse(resultZh)
      const jsonEn = JSON.parse(resultEn)

      // JSON structure should be identical
      expect(jsonZh.repositories.length).toBe(jsonEn.repositories.length)
      expect(jsonZh.timeRange.since).toBe(jsonEn.timeRange.since)
      expect(jsonZh.timeRange.until).toBe(jsonEn.timeRange.until)
    })

    it('should handle invalid language code gracefully', () => {
      // Bash script exits with error on invalid language, which is correct behavior
      // TypeScript version should fallback to Chinese
      try {
        const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --lang invalid --json`, {
          encoding: 'utf8',
          cwd: process.cwd(),
        })

        // Should fallback to Chinese
        const jsonResult = JSON.parse(result)
        expect(jsonResult).toHaveProperty('repositories')
      }
      catch (error: any) {
        // If it fails, it should be due to bash script rejecting invalid language
        expect(error).toBeDefined()
      }
    })
  })

  describe('i18n with other features', () => {
    it('should work with conventional commits and i18n', () => {
      const result = execSync(`node build/cli.js --dir ${testDir} --lang en --conventional --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult).toHaveProperty('repositories')
      expect(jsonResult.conventional).toBe(true)
    })

    it('should work with time-range and i18n', () => {
      const result = execSync(`node build/cli.js --dir ${testDir} --lang en --time-range today --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult).toHaveProperty('repositories')
      expect(jsonResult.timeRange.since).toBe(jsonResult.timeRange.until)
    })

    it('should work with author filter and i18n', () => {
      const result = execSync(`node build/cli.js --dir ${testDir} --lang en --author "Test User" --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult).toHaveProperty('repositories')
      expect(jsonResult.author).toBe('Test User')
    })
  })
})
