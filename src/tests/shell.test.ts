import { expect, test,  } from 'bun:test'

const scriptPath = '../scripts/weekly-git-summary.sh'
test('shell --help', () => {
  // 执行 ../weekly-git-summary.sh 脚本
  const { stdout, exitCode } = Bun.spawnSync({
    cmd: ['bash', scriptPath, '--help'],
    cwd: __dirname,
    stdout: 'pipe',
  })
  // 断言脚本的退出码
  expect(exitCode).toBe(0)
  // 断言脚本的输出
  // 使用 utf-8 编码读取输出
  const output = stdout.toString('utf-8');
  expect(output).toMatchInlineSnapshot(`
    "\x1B[0;34m使用方法:\x1B[0m
      ../scripts/weekly-git-summary.sh [选项]

    \x1B[0;32m选项:\x1B[0m
      -h, --help         显示此帮助信息
      -d, --dir DIR      指定搜索目录 (默认: 当前目录)
      -s, --since DATE   指定开始日期 (格式: YYYY-MM-DD, 默认: 本周一)
      -u, --until DATE   指定结束日期 (格式: YYYY-MM-DD, 默认: 今天)
      -a, --author NAME  只显示指定作者的提交
      -j, --json         以JSON格式输出结果
      -m, --md           以Markdown格式输出结果

    \x1B[0;33m示例:\x1B[0m
      ../scripts/weekly-git-summary.sh --dir ~/projects --since 2023-01-01 --until 2023-01-31
      ../scripts/weekly-git-summary.sh --author '张三' --since 2023-01-01
      ../scripts/weekly-git-summary.sh --json --since 2023-01-01
    "
  `)
})

test('shell --dir --since --until', () => {
  const { stdout, exitCode } = Bun.spawnSync({
    cmd: ['bash', scriptPath, '--dir', '../..', '-s', '2024-01-01', '-u', '2025-04-17'],
    cwd: __dirname,
    stdout: 'pipe',
  })
  expect(exitCode).toBe(0)
  const output = stdout.toString('utf-8');
  expect(output).toMatchInlineSnapshot(`
    "\x1B[0;34m===== 工作内容Git提交记录汇总 =====\x1B[0m
    \x1B[0;32m统计时间范围:\x1B[0m 2024-01-01 到 2025-04-17
    \x1B[0;32m搜索目录:\x1B[0m ../..

    \x1B[0;33m项目: tools\x1B[0m

    \x1B[0;32m2025-03-10\x1B[0m
      • docs: 更新README并添加工具使用说明和示例图片 (作者: yinzhenyu, hash: b24d12d)
      • feat: 为Git周报工具添加调试模式和时间范围精确控制 (作者: yinzhenyu, hash: 1cced74)
      • feat: 新增跨平台的Git周报工具脚本 (作者: yinzhenyu, hash: 4fa509d)
      • Initial commit (作者: 尹振雨, hash: 78f9460)

    -----------------------------------------

    \x1B[0;34m===== 工作内容汇总完成 =====\x1B[0m
    "
  `)
})

test('shell --dir --since --util --json', () => {
  const { stdout, exitCode } = Bun.spawnSync({
    cmd: ['bash', scriptPath, '--dir', '../..', '-s', '2024-01-01', '-u', '2025-04-17', '--json'],
    cwd: __dirname,
    stdout: 'pipe',
  })
  expect(exitCode).toBe(0)
  const output = stdout.toString('utf-8');
  expect(output).toMatchInlineSnapshot(`
    "{
      "timeRange": {
        "since": "2024-01-01",
        "until": "2025-04-17"
      },
      "searchDir": "../..",
      "repositories": [
        {
          "name": "tools",
          "commits": [

            {
              "date": "2025-03-10",
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
              ]
            }
          ]
        }

      ]
    }
    "
  `);
})

test('shell --dir --since --util --md', () => {
  const { stdout, exitCode } = Bun.spawnSync({
    cmd: ['bash', scriptPath, '--dir', '../..', '-s', '2024-01-01', '-u', '2025-04-17', '--md'],
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

test('shell --dir --since --util --author', () => {
  const { stdout, exitCode } = Bun.spawnSync({
    cmd: ['bash', scriptPath, '--dir', '../..', '-s', '2024-01-01', '-u', '2025-04-17', '--author', 'notexist'],
    cwd: __dirname,
    stdout: 'pipe',
  })
  expect(exitCode).toBe(0)
  const output = stdout.toString('utf-8');
  expect(output).toMatchInlineSnapshot(`
    "\x1B[0;34m===== 工作内容Git提交记录汇总 =====\x1B[0m
    \x1B[0;32m统计时间范围:\x1B[0m 2024-01-01 到 2025-04-17
    \x1B[0;32m搜索目录:\x1B[0m ../..
    \x1B[0;32m作者过滤:\x1B[0m notexist

    \x1B[0;34m===== 工作内容汇总完成 =====\x1B[0m
    "
  `)
}
)