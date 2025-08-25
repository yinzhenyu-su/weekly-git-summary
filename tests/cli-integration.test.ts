import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const buildDir = join(process.cwd(), 'build')

describe('CLI Integration Tests', () => {
  it('should delegate new features from shell script to Node.js version', () => {
    // Skip on Windows since it uses different scripts
    if (process.platform === 'win32') {
      console.log('Skipping shell script test on Windows')
      return
    }

    if (!existsSync(buildDir)) {
      execSync('bun run build.ts', { cwd: process.cwd() })
    }

    const result = execSync('bash build/weekly-git-summary.sh --conventional --time-range today --json 2>/dev/null', {
      encoding: 'utf8',
      cwd: process.cwd(),
    })

    // Extract JSON from output (filter out non-JSON lines)
    const lines = result.split('\n')
    const jsonLine = lines.find(line => line.trim().startsWith('{'))
    const jsonStr = lines.slice(lines.indexOf(jsonLine)).join('\n').trim()
    
    const jsonResult = JSON.parse(jsonStr)
    expect(jsonResult).toHaveProperty('conventional')
    expect(jsonResult.conventional).toBe(true)
    expect(jsonResult).toHaveProperty('timeRange')
    expect(jsonResult.timeRange.since).toBe(jsonResult.timeRange.until)
    expect(jsonResult).toHaveProperty('statistics')
  })

  it('should maintain backward compatibility in shell script', () => {
    // Skip on Windows since it uses different scripts
    if (process.platform === 'win32') {
      console.log('Skipping shell script test on Windows')
      return
    }

    if (!existsSync(buildDir)) {
      execSync('bun run build.ts', { cwd: process.cwd() })
    }

    const result = execSync('bash build/weekly-git-summary.sh --json', {
      encoding: 'utf8',
      cwd: process.cwd(),
    })

    const jsonResult = JSON.parse(result)
    expect(jsonResult).toHaveProperty('timeRange')
    expect(jsonResult).toHaveProperty('repositories')
    expect(jsonResult.conventional).toBeUndefined()
  })

  it('should show updated help in shell script', () => {
    // Skip on Windows since it uses different scripts
    if (process.platform === 'win32') {
      console.log('Skipping shell script test on Windows')
      return
    }

    if (!existsSync(buildDir)) {
      execSync('bun run build.ts', { cwd: process.cwd() })
    }

    const result = execSync('bash build/weekly-git-summary.sh --help', {
      encoding: 'utf8',
      cwd: process.cwd(),
    })

    expect(result).toContain('--message-pattern')
    expect(result).toContain('--conventional')
    expect(result).toContain('--time-range')
    expect(result).toContain('新功能 (自动使用 Node.js 版本)')
  })

  it('should work with CLI wrapper for new features', () => {
    if (!existsSync(buildDir)) {
      execSync('bun run build.ts', { cwd: process.cwd() })
    }

    const result = execSync('node build/cli.js --conventional --time-range today --json 2>/dev/null', {
      encoding: 'utf8',
      cwd: process.cwd(),
    })

    // Extract JSON from output (filter out non-JSON lines)
    const lines = result.split('\n')
    const jsonLine = lines.find(line => line.trim().startsWith('{'))
    const jsonStr = lines.slice(lines.indexOf(jsonLine)).join('\n').trim()

    const jsonResult = JSON.parse(jsonStr)
    expect(jsonResult).toHaveProperty('conventional')
    expect(jsonResult.conventional).toBe(true)
    expect(jsonResult).toHaveProperty('statistics')
    expect(jsonResult.statistics).toHaveProperty('totalCommits')
    expect(jsonResult.statistics).toHaveProperty('typeDistribution')
  })
})