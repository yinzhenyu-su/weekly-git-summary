import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'

const testRoot = join(process.cwd(), 'test-v2-root')
const repo1Dir = join(testRoot, 'repo1')
const repo2Dir = join(testRoot, 'repo2')
const buildDir = join(process.cwd(), 'build')

describe('v2 Features Tests', () => {
	beforeAll(() => {
		// Ensure build exists
		if (!existsSync(buildDir)) {
			execSync('bun run build.ts', { cwd: process.cwd() })
		}

		// Clean and create test directories
		if (existsSync(testRoot)) {
			rmSync(testRoot, { recursive: true, force: true })
		}
		mkdirSync(testRoot, { recursive: true })
		mkdirSync(repo1Dir, { recursive: true })
		mkdirSync(repo2Dir, { recursive: true })

		// Setup Repo 1
		execSync('git init --initial-branch=main', { cwd: repo1Dir })
		execSync('git config user.name "Test User"', { cwd: repo1Dir })
		execSync('git config user.email "test@example.com"', { cwd: repo1Dir })
		writeFileSync(join(repo1Dir, 'file1.txt'), 'content1')
		execSync('git add .', { cwd: repo1Dir })
		execSync('git commit -m "repo1 main commit"', { cwd: repo1Dir })

		// Create dev branch in Repo 1
		execSync('git checkout -b dev', { cwd: repo1Dir })
		writeFileSync(join(repo1Dir, 'file1_dev.txt'), 'content1_dev')
		execSync('git add .', { cwd: repo1Dir })
		execSync('git commit -m "repo1 dev commit"', { cwd: repo1Dir })
		execSync('git checkout main', { cwd: repo1Dir })

		// Setup Repo 2
		execSync('git init --initial-branch=main', { cwd: repo2Dir })
		execSync('git config user.name "Test User"', { cwd: repo2Dir })
		execSync('git config user.email "test@example.com"', { cwd: repo2Dir })
		writeFileSync(join(repo2Dir, 'file2.txt'), 'content2')
		execSync('git add .', { cwd: repo2Dir })
		execSync('git commit -m "repo2 main commit"', { cwd: repo2Dir })
	})

	afterAll(() => {
		if (existsSync(testRoot)) {
			rmSync(testRoot, { recursive: true, force: true })
		}
	})

	it('should support multiple repositories via CLI', () => {
		const result = execSync(
			`node build/weekly-git-summary.js -d ${repo1Dir} -d ${repo2Dir} -b main --json`,
			{ encoding: 'utf8', cwd: process.cwd() }
		)
		const json = JSON.parse(result)

		expect(json.version).toBe('2.0.0')
		expect(json.searchDirs).toContain(repo1Dir)
		expect(json.searchDirs).toContain(repo2Dir)
		// Should find both repos
		expect(json.repositories.length).toBeGreaterThanOrEqual(2)
		const repoNames = json.repositories.map((r: any) => r.name)
		expect(repoNames).toContain('repo1')
		expect(repoNames).toContain('repo2')
	})

	it('should support multiple branches via CLI', () => {
		// Only repo1 has 'dev' branch, repo2 only has 'main'
		// If we ask for 'main' and 'dev', repo1 should be included (merged), repo2 might be skipped or partial depending on logic
		// Logic: "If branches are specified, only repositories containing *all* specified branches will be included."
		// Wait, the requirement said: "If a repository has *some* but not *all*, it will report on the available ones." 
		// Actually, let's re-read the implementation plan or code.
		// Code says: 
		// for (const branch of branches) { try { check exist } catch { } }
		// if (validBranches.length === 0) return []
		// So it includes repo if AT LEAST ONE branch exists.

		const result = execSync(
			`node build/weekly-git-summary.js -d ${repo1Dir} -b main -b dev --json`,
			{ encoding: 'utf8', cwd: process.cwd() }
		)
		const json = JSON.parse(result)

		expect(json.repositories).toHaveLength(1)
		expect(json.repositories[0].name).toBe('repo1')

		// Check commits from both branches
		const allMessages = json.repositories[0].commits
			.flatMap((d: any) => d.commits)
			.map((c: any) => c.message)

		expect(allMessages).toContain('repo1 main commit')
		expect(allMessages).toContain('repo1 dev commit')
	})

	it('should filter out repos that have none of the specified branches', () => {
		// repo2 does not have 'dev'
		// If we ask for ONLY 'dev', repo2 should be skipped
		const result = execSync(
			`node build/weekly-git-summary.js -d ${repo1Dir} -d ${repo2Dir} -b dev --json`,
			{ encoding: 'utf8', cwd: process.cwd() }
		)
		const json = JSON.parse(result)

		const repoNames = json.repositories.map((r: any) => r.name)
		expect(repoNames).toContain('repo1')
		expect(repoNames).not.toContain('repo2')
	})
})
