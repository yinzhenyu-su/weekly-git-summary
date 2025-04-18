import { expect, test,  } from 'bun:test'

const scriptPath = '../scripts/weekly-git-summary.ps1'
test('pwsh --help', () => {
  // 执行 ../weekly-git-summary.sh 脚本
  const { stdout, exitCode } = Bun.spawnSync({
    cmd: ['pwsh', scriptPath, '--help'],
    cwd: __dirname,
    stdout: 'pipe',
  })
  // 断言脚本的退出码
  expect(exitCode).toBe(0)
  // 断言脚本的输出
  // 使用 utf-8 编码读取输出
  const output = stdout.toString('utf-8');
  expect(output).toMatchInlineSnapshot(`
    "使用方法:
      .\\weekly-git-summary.ps1 [选项]

    选项:
      -h, --help         显示此帮助信息
      -d, --dir DIR      指定搜索目录 (默认: 当前目录)
      -s, --since DATE   指定开始日期 (格式: YYYY-MM-DD, 默认: 本周一)
      -u, --until DATE   指定结束日期 (格式: YYYY-MM-DD, 默认: 今天)
      -a, --author NAME  只显示指定作者的提交
      -j, --json         以JSON格式输出结果
      -m, --md           以Markdown格式输出结果

    示例:
      .\\weekly-git-summary.ps1 -dir C:\\projects -since 2023-01-01 -until 2023-01-31
      .\\weekly-git-summary.ps1 -author '张三' -since 2023-01-01
      .\\weekly-git-summary.ps1 -json -since 2023-01-01
    "
  `)
})

test('pwsh --dir --since --until', () => {
  const { stdout, exitCode } = Bun.spawnSync({
    cmd: ['pwsh', scriptPath, '--dir', '../..', '-s', '2024-01-01', '-u', '2025-04-17'],
    cwd: __dirname,
    stdout: 'pipe',
  })
  expect(exitCode).toBe(0)
  const output = stdout.toString('utf-8');
  expect(output).toMatchInlineSnapshot(`
    "===== 工作内容Git提交记录汇总 =====
    统计时间范围: 2024-01-01 到 2025-04-17
    搜索目录: ../..

    项目: tools

    2025-03-10
      • docs: 更新README并添加工具使用说明和示例图片 (作者: yinzhenyu, hash: b24d12d)
      • feat: 为Git周报工具添加调试模式和时间范围精确控制 (作者: yinzhenyu, hash: 1cced74)
      • feat: 新增跨平台的Git周报工具脚本 (作者: yinzhenyu, hash: 4fa509d)
      • Initial commit (作者: 尹振雨, hash: 78f9460)

    -----------------------------------------

    ===== 工作内容汇总完成 =====
    "
  `)
})

const deepEqual = (a: any, b: any) => {
  if (typeof a !== typeof b) {
    return false;
  }
  if (typeof a === 'object' && a !== null && b !== null) {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) {
          return false;
        }
      }
      return true;
    } else {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) {
        return false;
      }
      for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
          return false;
        }
      }
      return true;
    }
  }
  return a === b;
}

test('pwsh --dir --since --util --json', () => {
  const { stdout, exitCode } = Bun.spawnSync({
    cmd: ['pwsh', scriptPath, '--dir', '../..', '-s', '2024-01-01', '-u', '2025-04-17', '--json'],
    cwd: __dirname,
    stdout: 'pipe',
  })
  expect(exitCode).toBe(0)
  const output = stdout.toString('utf-8');
  const jsonOutput = JSON.parse(`
    {
      "timeRange": {
        "until": "2025-04-17",
        "since": "2024-01-01"
      },
      "searchDir": "../..",
      "repositories": [
        {
          "name": "tools",
          "commits": [
            {
              "commits": [
                {
                  "message": "docs: 更新README并添加工具使用说明和示例图片",
                  "author": "yinzhenyu",
                  "hash": "b24d12d"
                },
                {
                  "message": "feat: 为Git周报工具添加调试模式和时间范围精确控制",
                  "author": "yinzhenyu",
                  "hash": "1cced74"
                },
                {
                  "message": "feat: 新增跨平台的Git周报工具脚本",
                  "author": "yinzhenyu",
                  "hash": "4fa509d"
                },
                {
                  "message": "Initial commit",
                  "author": "尹振雨",
                  "hash": "78f9460"
                }
              ],
              "date": "2025-03-10"
            }
          ]
        }
      ]
    }
  `);
  expect(deepEqual(JSON.parse(output), jsonOutput)).toBe(true)
  // expect(output).toMatchInlineSnapshot()
})

test('pwsh --dir --since --util --md', () => {
  const { stdout, exitCode } = Bun.spawnSync({
    cmd: ['pwsh', scriptPath, '--dir', '../..', '-s', '2024-01-01', '-u', '2025-04-17', '--md'],
    cwd: __dirname,
    stdout: 'pipe',
  })
  expect(exitCode).toBe(0)
  const output = stdout.toString('utf-8');
  expect(output).toMatchInlineSnapshot(`
    "# 工作内容Git提交记录汇总

    - **统计时间范围**: 2024-01-01 到 2025-04-17
    - **搜索目录**: ../..


    ## tools

    ### 2025-03-10
    - docs: 更新README并添加工具使用说明和示例图片 (作者: yinzhenyu, hash: b24d12d)
    - feat: 为Git周报工具添加调试模式和时间范围精确控制 (作者: yinzhenyu, hash: 1cced74)
    - feat: 新增跨平台的Git周报工具脚本 (作者: yinzhenyu, hash: 4fa509d)
    - Initial commit (作者: 尹振雨, hash: 78f9460)


    ---
    *工作内容汇总完成*
    "
  `)
}
)

test('pwsh --dir --since --util --author', () => {
  const { stdout, exitCode } = Bun.spawnSync({
    cmd: ['pwsh', scriptPath, '--dir', '../..', '-s', '2024-01-01', '-u', '2025-04-17', '--author', 'notexist'],
    cwd: __dirname,
    stdout: 'pipe',
  })
  expect(exitCode).toBe(0)
  const output = stdout.toString('utf-8');
  expect(output).toMatchInlineSnapshot(`
    "===== 工作内容Git提交记录汇总 =====
    统计时间范围: 2024-01-01 到 2025-04-17
    搜索目录: ../..
    作者过滤: notexist

    ===== 工作内容汇总完成 =====
    "
  `)
}
)