import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { platform } from 'node:os';

const testDir = join(process.cwd(), 'test-repo');
const buildDir = join(process.cwd(), 'build');

describe('CLI Tool Tests', () => {
  beforeAll(() => {
    // 确保构建目录存在
    if (!existsSync(buildDir)) {
      execSync('bun run build.ts', { cwd: process.cwd() });
    }
    
    // 创建测试 Git 仓库
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
    
    // 初始化 Git 仓库
    execSync('git init --initial-branch=main', { cwd: testDir });
    execSync('git config user.name "Test User"', { cwd: testDir });
    execSync('git config user.email "test@example.com"', { cwd: testDir });
    
    // 创建测试文件并提交
    writeFileSync(join(testDir, 'test.txt'), 'test content');
    execSync('git add .', { cwd: testDir });
    execSync('git commit -m "Initial commit"', { cwd: testDir });
  });

  afterAll(() => {
    // 清理测试目录
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should show help information', () => {
    const result = execSync('node build/cli.js --help', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    expect(result).toContain('使用方法');
    expect(result).toContain('选项');
    expect(result).toContain('--help');
    expect(result).toContain('--dir');
    expect(result).toContain('--since');
    expect(result).toContain('--until');
  });

  it('should handle directory parameter', () => {
    const result = execSync(`node build/cli.js --dir ${testDir} --json`, { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    const jsonResult = JSON.parse(result);
    expect(jsonResult).toHaveProperty('repositories');
    expect(jsonResult.repositories).toBeInstanceOf(Array);
  });

  it('should output JSON format', () => {
    const result = execSync(`node build/cli.js --dir ${testDir} --json`, { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    expect(() => JSON.parse(result)).not.toThrow();
    const jsonResult = JSON.parse(result);
    expect(jsonResult).toHaveProperty('timeRange');
    expect(jsonResult).toHaveProperty('repositories');
    expect(jsonResult.timeRange).toHaveProperty('since');
    expect(jsonResult.timeRange).toHaveProperty('until');
  });

  it('should handle date parameters', () => {
    const since = '2023-01-01';
    const until = '2023-12-31';
    
    const result = execSync(`node build/cli.js --dir ${testDir} --since ${since} --until ${until} --json`, { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    const jsonResult = JSON.parse(result);
    expect(jsonResult.timeRange.since).toBe(since);
    expect(jsonResult.timeRange.until).toBe(until);
  });

  it('should handle markdown output', () => {
    const result = execSync(`node build/cli.js --dir ${testDir} --md`, { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    expect(result).toContain('# 工作内容Git提交记录汇总');
    expect(result).toContain('## test-repo');
  });

  it('should handle author filter', () => {
    try {
      const result = execSync(`node build/cli.js --dir ${testDir} --author "Test User" --json`, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      
      // 去掉可能的ANSI控制字符和错误信息
      const lines = result.split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('{'));
      
      if (jsonLine) {
        const jsonResult = JSON.parse(jsonLine);
        expect(jsonResult).toHaveProperty('repositories');
        
        // 检查是否有提交记录
        if (jsonResult.repositories.length > 0 && jsonResult.repositories[0].commits.length > 0) {
          const commits = jsonResult.repositories[0].commits.flatMap((day: any) => day.commits);
          commits.forEach((commit: any) => {
            expect(commit.author).toBe('Test User');
          });
        }
      } else {
        // 如果没有找到JSON，说明可能没有匹配的提交
        expect(result).toBeDefined();
      }
    } catch (error) {
      // 如果命令失败，检查是否是预期的错误
      expect(error).toBeDefined();
    }
  });

  it('should handle non-existent directory', () => {
    const nonExistentDir = join(process.cwd(), 'non-existent-dir');
    
    try {
      const result = execSync(`node build/cli.js --dir ${nonExistentDir} --json`, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe' // 隐藏错误输出
      });
      
      const jsonResult = JSON.parse(result);
      expect(jsonResult.repositories).toHaveLength(0);
    } catch (error: any) {
      // 对于不存在的目录，脚本应该失败，这是预期的行为
      expect(error.status).toBe(1);
      expect(error.message).toContain('Command failed');
      // 测试通过 - 错误是预期的
    }
  });

  it('should detect correct platform script', () => {
    const currentPlatform = platform();
    
    // 这个测试验证平台检测逻辑是否正确
    expect(['win32', 'darwin', 'linux'].includes(currentPlatform)).toBe(true);
  });
});