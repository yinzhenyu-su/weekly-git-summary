import { describe, expect, test } from 'bun:test'

describe('URL Conversion Tests', () => {
  // Helper function to test URL conversion (matches the logic in weekly-git-summary.ts)
  function convertGitRemoteToUrl(remoteInfo: string): string {
    const parts = remoteInfo.split(/\s+/)
    let remoteUrl = parts[1] || ''

    // 检查 URL 是否包含 "git@"，如果是，则转换为 URL 格式，去除 .git 后缀
    if (remoteUrl.startsWith('git@')) {
      // 提取主机名和路径
      const hostPath = remoteUrl
        .replace(/^git@/, '')
        .replace(':', '/')
        .replace(/\.git$/, '')
      remoteUrl = hostPath
    }
    // 如果 URL 以 http:// 或 https:// 开头，去除协议前缀和 .git 后缀
    else if (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://')) {
      remoteUrl = remoteUrl
        .replace(/^https?:\/\//, '')
        .replace(/\.git$/, '')
    }

    return remoteUrl
  }

  test('should convert SSH URL to clean URL', () => {
    const input = 'origin\tgit@github.com:user/repo.git'
    const expected = 'github.com/user/repo'
    expect(convertGitRemoteToUrl(input)).toBe(expected)
  })

  test('should convert HTTPS URL to clean URL', () => {
    const input = 'origin\thttps://github.com/user/repo.git'
    const expected = 'github.com/user/repo'
    expect(convertGitRemoteToUrl(input)).toBe(expected)
  })

  test('should convert HTTP URL to clean URL', () => {
    const input = 'origin\thttp://github.com/user/repo.git'
    const expected = 'github.com/user/repo'
    expect(convertGitRemoteToUrl(input)).toBe(expected)
  })

  test('should handle HTTPS URL without .git suffix', () => {
    const input = 'origin\thttps://github.com/user/repo'
    const expected = 'github.com/user/repo'
    expect(convertGitRemoteToUrl(input)).toBe(expected)
  })

  test('should handle HTTP URL without .git suffix', () => {
    const input = 'origin\thttp://github.com/user/repo'
    const expected = 'github.com/user/repo'
    expect(convertGitRemoteToUrl(input)).toBe(expected)
  })

  test('should handle GitLab HTTPS URL', () => {
    const input = 'origin\thttps://gitlab.com/user/repo.git'
    const expected = 'gitlab.com/user/repo'
    expect(convertGitRemoteToUrl(input)).toBe(expected)
  })

  test('should handle empty URL', () => {
    const input = 'origin\t'
    const expected = ''
    expect(convertGitRemoteToUrl(input)).toBe(expected)
  })
})

describe('HTML URL Protocol Handling', () => {
  // Helper function to simulate the HTML template logic
  function buildCommitUrl(repoUrl: string, commitHash: string): string {
    if (!repoUrl)
      return ''

    const isGitHub = repoUrl.includes('github.com')
    // 检查 repoUrl 是否已经包含协议，如果没有则添加 http://
    const urlWithProtocol = (repoUrl.startsWith('http://') || repoUrl.startsWith('https://'))
      ? repoUrl
      : `http://${repoUrl}`

    return `${urlWithProtocol}/${isGitHub ? '' : '-/'}commit/${commitHash}`
  }

  test('should not double-add protocol for HTTPS URLs', () => {
    const repoUrl = 'https://github.com/user/repo'
    const hash = 'abc123'
    const expected = 'https://github.com/user/repo/commit/abc123'
    expect(buildCommitUrl(repoUrl, hash)).toBe(expected)
  })

  test('should not double-add protocol for HTTP URLs', () => {
    const repoUrl = 'http://github.com/user/repo'
    const hash = 'abc123'
    const expected = 'http://github.com/user/repo/commit/abc123'
    expect(buildCommitUrl(repoUrl, hash)).toBe(expected)
  })

  test('should add protocol for URLs without protocol', () => {
    const repoUrl = 'github.com/user/repo'
    const hash = 'abc123'
    const expected = 'http://github.com/user/repo/commit/abc123'
    expect(buildCommitUrl(repoUrl, hash)).toBe(expected)
  })

  test('should use correct path for GitLab URLs', () => {
    const repoUrl = 'https://gitlab.com/user/repo'
    const hash = 'abc123'
    const expected = 'https://gitlab.com/user/repo/-/commit/abc123'
    expect(buildCommitUrl(repoUrl, hash)).toBe(expected)
  })

  test('should handle empty repoUrl', () => {
    const repoUrl = ''
    const hash = 'abc123'
    const expected = ''
    expect(buildCommitUrl(repoUrl, hash)).toBe(expected)
  })
})
