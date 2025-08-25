import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'

const testDir = join(process.cwd(), 'test-new-features-repo')
const buildDir = join(process.cwd(), 'build')

describe('New Features Tests', () => {
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

    // 创建带有传统提交格式的测试提交
    writeFileSync(join(testDir, 'feat.txt'), 'feat content')
    execSync('git add .', { cwd: testDir })
    execSync('git commit -m "feat: add new feature"', { cwd: testDir })

    writeFileSync(join(testDir, 'fix.txt'), 'fix content')
    execSync('git add .', { cwd: testDir })
    execSync('git commit -m "fix(bug): resolve critical issue"', { cwd: testDir })

    writeFileSync(join(testDir, 'docs.txt'), 'docs content')
    execSync('git add .', { cwd: testDir })
    execSync('git commit -m "docs: update README"', { cwd: testDir })

    writeFileSync(join(testDir, 'other.txt'), 'other content')
    execSync('git add .', { cwd: testDir })
    execSync('git commit -m "Update configuration"', { cwd: testDir })

    writeFileSync(join(testDir, 'breaking.txt'), 'breaking content')
    execSync('git add .', { cwd: testDir })
    execSync('git commit -m "feat!: major API changes"', { cwd: testDir })
  })

  afterAll(() => {
    // 清理测试目录
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('Time Range Presets', () => {
    it('should handle today preset', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --time-range today --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult.timeRange.since).toBe(jsonResult.timeRange.until)
      expect(jsonResult.timeRange.since).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should handle this-week preset', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --time-range this-week --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult.timeRange.since).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(jsonResult.timeRange.until).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      // Since date should be before or equal to until date
      expect(new Date(jsonResult.timeRange.since) <= new Date(jsonResult.timeRange.until)).toBe(true)
    })

    it('should handle invalid time range preset', () => {
      try {
        execSync(`node build/weekly-git-summary.js --dir ${testDir} --time-range invalid-range --json`, {
          encoding: 'utf8',
          cwd: process.cwd(),
          stdio: 'pipe',
        })
        expect(false).toBe(true) // Should not reach here
      }
      catch (error: any) {
        expect(error.status).toBe(1)
        expect(error.stderr.toString()).toContain('未知的时间范围预设')
      }
    })
  })

  describe('Message Pattern Filtering', () => {
    it('should filter commits by exact string match', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --message-pattern "feat" --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult.messagePattern).toBe('feat')
      expect(jsonResult.repositories).toHaveLength(1)

      const allCommits = jsonResult.repositories[0].commits.flatMap((day: any) => day.commits)
      expect(allCommits).toHaveLength(2) // feat: and feat!:
      allCommits.forEach((commit: any) => {
        expect(commit.message).toContain('feat')
      })
    })

    it('should filter commits by regex pattern', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --message-pattern "^(feat|fix)" --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult.repositories).toHaveLength(1)

      const allCommits = jsonResult.repositories[0].commits.flatMap((day: any) => day.commits)
      expect(allCommits).toHaveLength(3) // feat:, fix:, feat!:
      allCommits.forEach((commit: any) => {
        expect(commit.message).toMatch(/^(feat|fix)/)
      })
    })

    it('should handle invalid regex gracefully', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --message-pattern "[invalid" --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult.messagePattern).toBe('[invalid')
      // Should fallback to string matching and return empty results
      expect(jsonResult.repositories).toHaveLength(0)
    })
  })

  describe('Conventional Commits Support', () => {
    it('should parse conventional commits and add type information', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --conventional --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult.conventional).toBe(true)
      expect(jsonResult.repositories).toHaveLength(1)

      const allCommits = jsonResult.repositories[0].commits.flatMap((day: any) => day.commits)
      expect(allCommits).toHaveLength(5)

      // Check that conventional commits have type information
      const featCommit = allCommits.find((commit: any) => commit.message.includes('add new feature'))
      expect(featCommit.type).toBe('feat')

      const fixCommit = allCommits.find((commit: any) => commit.message.includes('resolve critical issue'))
      expect(fixCommit.type).toBe('fix')

      const docsCommit = allCommits.find((commit: any) => commit.message.includes('update README'))
      expect(docsCommit.type).toBe('docs')

      const otherCommit = allCommits.find((commit: any) => commit.message.includes('Update configuration'))
      expect(otherCommit.type).toBe('other')

      const breakingCommit = allCommits.find((commit: any) => commit.message.includes('major API changes'))
      expect(breakingCommit.type).toBe('feat')
    })

    it('should generate type distribution statistics', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --conventional --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult.statistics.typeDistribution).toBeDefined()
      expect(jsonResult.statistics.typeDistribution.feat).toBe(2)
      expect(jsonResult.statistics.typeDistribution.fix).toBe(1)
      expect(jsonResult.statistics.typeDistribution.docs).toBe(1)
      expect(jsonResult.statistics.typeDistribution.other).toBe(1)
    })
  })

  describe('Enhanced Statistics', () => {
    it('should provide comprehensive statistics', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult.statistics).toBeDefined()
      expect(jsonResult.statistics.totalCommits).toBe(5)
      expect(jsonResult.statistics.participantCount).toBe(1)
      expect(jsonResult.statistics.participants).toEqual(['Test User'])
    })

    it('should show enhanced statistics in text output', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} -s 2025-08-25 -u 2025-08-25 --conventional --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(JSON.parse(result)).toHaveProperty('statistics')
      const statistics = JSON.parse(result).statistics
      expect(statistics).toBeDefined()
      expect(statistics.totalCommits).toBe(5)
      expect(statistics.participantCount).toBe(1)
      expect(statistics.participants).toEqual(['Test User'])
    })

    it('should show enhanced statistics in markdown output', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} -s 2025-08-25 -u 2025-08-25 --conventional --md`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      expect(result).toContain(`## 统计信息`)
      expect(result).toContain(`- **总提交数**: 5`)
      expect(result).toContain(`- **参与人数**: 1`)
      expect(result).toContain(`- **参与者**: Test User`)
    })
  })

  describe('Composable Features', () => {
    it('should combine message pattern filtering with conventional commits', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --message-pattern "fix" --conventional --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult.messagePattern).toBe('fix')
      expect(jsonResult.conventional).toBe(true)
      expect(jsonResult.repositories).toHaveLength(1)

      const allCommits = jsonResult.repositories[0].commits.flatMap((day: any) => day.commits)
      expect(allCommits).toHaveLength(1)
      expect(allCommits[0].type).toBe('fix')
      expect(jsonResult.statistics.typeDistribution.fix).toBe(1)
    })

    it('should combine time range presets with other filters', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --time-range today --message-pattern "feat" --conventional --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult.timeRange.since).toBe(jsonResult.timeRange.until)
      expect(jsonResult.messagePattern).toBe('feat')
      expect(jsonResult.conventional).toBe(true)
    })

    it('should combine author filtering with new features', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --author "Test User" --conventional --message-pattern "docs" --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult.author).toBe('Test User')
      expect(jsonResult.messagePattern).toBe('docs')
      expect(jsonResult.conventional).toBe(true)

      const allCommits = jsonResult.repositories[0].commits.flatMap((day: any) => day.commits)
      expect(allCommits).toHaveLength(1)
      expect(allCommits[0].type).toBe('docs')
      expect(allCommits[0].author).toBe('Test User')
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain existing behavior without new flags', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult).toHaveProperty('timeRange')
      expect(jsonResult).toHaveProperty('repositories')
      expect(jsonResult).toHaveProperty('statistics')

      // Should not have new optional properties when not specified
      expect(jsonResult.messagePattern).toBeUndefined()
      expect(jsonResult.conventional).toBeUndefined()

      // Commits should not have type information when conventional is not enabled
      const allCommits = jsonResult.repositories[0].commits.flatMap((day: any) => day.commits)
      allCommits.forEach((commit: any) => {
        expect(commit.type).toBeUndefined()
      })
    })

    it('should maintain existing CLI interface', () => {
      const result = execSync(`node build/weekly-git-summary.js --dir ${testDir} --since 2023-01-01 --until 2023-12-31 --author "Test User" --json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      })

      const jsonResult = JSON.parse(result)
      expect(jsonResult.timeRange.since).toBe('2023-01-01')
      expect(jsonResult.timeRange.until).toBe('2023-12-31')
      expect(jsonResult.author).toBe('Test User')
    })
  })

  describe('Error Handling', () => {
    it('should handle empty repositories gracefully', () => {
      const emptyTestDir = join(process.cwd(), 'empty-test-repo')

      try {
        // Create empty repo
        if (existsSync(emptyTestDir)) {
          rmSync(emptyTestDir, { recursive: true, force: true })
        }
        mkdirSync(emptyTestDir, { recursive: true })

        const result = execSync(`node build/weekly-git-summary.js --dir ${emptyTestDir} --conventional --json`, {
          encoding: 'utf8',
          cwd: process.cwd(),
        })

        const jsonResult = JSON.parse(result)
        expect(jsonResult.repositories).toHaveLength(0)
        expect(jsonResult.statistics.totalCommits).toBe(0)
        expect(jsonResult.statistics.participantCount).toBe(0)
      }
      finally {
        if (existsSync(emptyTestDir)) {
          rmSync(emptyTestDir, { recursive: true, force: true })
        }
      }
    })

    it('should handle non-existent directory', () => {
      try {
        execSync(`node build/weekly-git-summary.js --dir /non/existent/dir --json`, {
          encoding: 'utf8',
          cwd: process.cwd(),
          stdio: 'pipe',
        })
        expect(false).toBe(true) // Should not reach here
      }
      catch (error: any) {
        expect(error.status).toBe(1)
        expect(error.stderr.toString()).toContain('不存在')
      }
    })
  })
})
