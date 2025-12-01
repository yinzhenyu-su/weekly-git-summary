import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'

const tempDir = join(process.cwd(), 'temp-test-branch-default')
const scriptPath = join(process.cwd(), 'scripts', 'weekly-git-summary.ts')

describe('Branch Default Behavior', () => {
	beforeAll(() => {
		// Clean up if exists
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
		mkdirSync(tempDir)

		// Init git repo with main branch
		execSync('git init --initial-branch=main', { cwd: tempDir })
		execSync('git config user.name "Test User"', { cwd: tempDir })
		execSync('git config user.email "test@example.com"', { cwd: tempDir })

		// Create a commit on main
		writeFileSync(join(tempDir, 'file1.txt'), 'content1')
		execSync('git add .', { cwd: tempDir })
		execSync('git commit -m "feat: commit on main"', { cwd: tempDir })

		// Create a new branch 'feature-branch' and switch to it
		execSync('git checkout -b feature-branch', { cwd: tempDir })
		writeFileSync(join(tempDir, 'file2.txt'), 'content2')
		execSync('git add .', { cwd: tempDir })
		execSync('git commit -m "feat: commit on feature-branch"', { cwd: tempDir })
	})

	afterAll(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	it('should default to current branch (feature-branch) when -b is not provided', () => {
		// Run the script in the tempDir
		// We need to point the script to search in tempDir (which is also CWD in this case)
		const result = execSync(`bun run ${scriptPath} --json --time-range today`, {
			cwd: tempDir,
			encoding: 'utf8',
		})

		const json = JSON.parse(result)
		// Should find the repo
		expect(json.repositories).toHaveLength(1)
		// Should find the commit on feature-branch AND the one from main (since it's reachable)
		// Actually, it depends on the date. Both are today.
		const commits = json.repositories[0].commits[0].commits
		expect(commits.length).toBeGreaterThanOrEqual(2)
		const messages = commits.map((c: any) => c.message)
		expect(messages).toContain('feat: commit on feature-branch')
		expect(messages).toContain('feat: commit on main')
	})

	it('should not show commits from other branches if they are not merged (implied by filtering)', () => {
		// Switch back to main
		execSync('git checkout main', { cwd: tempDir })

		// Create another commit on main
		writeFileSync(join(tempDir, 'file3.txt'), 'content3')
		execSync('git add .', { cwd: tempDir })
		execSync('git commit -m "feat: second commit on main"', { cwd: tempDir })

		// Run script on main
		const result = execSync(`bun run ${scriptPath} --json --time-range today`, {
			cwd: tempDir,
			encoding: 'utf8',
		})

		const json = JSON.parse(result)
		expect(json.repositories).toHaveLength(1)
		const commits = json.repositories[0].commits[0].commits

		// Should find "feat: second commit on main"
		// And "feat: commit on main" (if it was today)
		// But NOT "feat: commit on feature-branch"
		const messages = commits.map((c: any) => c.message)
		expect(messages).toContain('feat: second commit on main')
		expect(messages).not.toContain('feat: commit on feature-branch')
	})
})
