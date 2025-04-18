import { expect, test } from 'bun:test'
import { main } from '../scripts/weekly-git-summary'

test('node --help', () => {


  // 模拟命令行参数
  process.argv = ['--help']
  main()

  // 断言输出内容
  expect(main()).toMatchInlineSnapshot(`
    "\x1B[34m===== 工作内容Git提交记录汇总 =====\x1B[0m
    \x1B[32m统计时间范围:\x1B[0m 2025-04-14 到 2025-04-18
    \x1B[32m搜索目录:\x1B[0m .

    \x1B[33m项目: tools\x1B[0m

    \x1B[32m2025-04-18\x1B[0m
      • refactor: 移除帮助信息中的调试模式示例 (作者: yinzhenyu, hash: bf6d2c1)
      • feat: 新增测试文件和配置，支持跨平台的Git周报工具 (作者: yinzhenyu, hash: b4f07bc)
      • refactor: 移除调试模式相关代码，简化脚本 (作者: yinzhenyu, hash: cc9d45e)
      • feat: 添加Markdown输出格式支持，并在提交记录中包含哈希值 (作者: yinzhenyu, hash: 2e2860d)

    -----------------------------------------

    \x1B[34m===== 工作内容汇总完成 =====\x1B[0m
    "
  `)
})

test('node --dir --since --until', () => {
  // 模拟命令行参数
  process.argv = ['-d', '.','-s', '2024-01-02', '-u', '2025-04-17']

  // 断言输出内容
  expect(main()).toMatchInlineSnapshot(`
    "\x1B[34m===== 工作内容Git提交记录汇总 =====\x1B[0m
    \x1B[32m统计时间范围:\x1B[0m 2024-01-02 到 2025-04-17
    \x1B[32m搜索目录:\x1B[0m .

    \x1B[33m项目: tools\x1B[0m

    \x1B[32m2025-03-10\x1B[0m
      • docs: 更新README并添加工具使用说明和示例图片 (作者: yinzhenyu, hash: b24d12d)
      • feat: 为Git周报工具添加调试模式和时间范围精确控制 (作者: yinzhenyu, hash: 1cced74)
      • feat: 新增跨平台的Git周报工具脚本 (作者: yinzhenyu, hash: 4fa509d)
      • Initial commit (作者: 尹振雨, hash: 78f9460)

    -----------------------------------------

    \x1B[34m===== 工作内容汇总完成 =====\x1B[0m
    "
  `)
})

test('node --dir --since --until --json', () => {
  // 模拟命令行参数
  process.argv = ['--dir', '.', '-s', '2024-01-01', '-u', '2025-04-17', '--json']
  // 断言输出内容
  expect(main()).toMatchInlineSnapshot(`
    "{
      "timeRange": {
        "since": "2024-01-01",
        "until": "2025-04-17"
      },
      "searchDir": ".",
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
  `)
})

test('node --dir --since --until --md', () => {
  // 模拟命令行参数
  process.argv = ['--dir', '.', '-s', '2024-01-01', '-u', '2025-04-17', '--md']
  // 断言输出内容
  expect(main()).toMatchInlineSnapshot(`
    "# 工作内容Git提交记录汇总

    - **统计时间范围**: 2024-01-01 到 2025-04-17
    - **搜索目录**: .


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
})

test('node --dir --since --until --author', () => {
  // 模拟命令行参数
  process.argv = ['--dir', '.', '-s', '2024-01-01', '-u', '2025-04-17', '--author', 'notexist']
  // 断言输出内容
  expect(main()).toMatchInlineSnapshot(`
    "\x1B[34m===== 工作内容Git提交记录汇总 =====\x1B[0m
    \x1B[32m统计时间范围:\x1B[0m 2024-01-01 到 2025-04-17
    \x1B[32m搜索目录:\x1B[0m .
    \x1B[32m作者过滤:\x1B[0m notexist

    \x1B[34m===== 工作内容汇总完成 =====\x1B[0m
    "
  `)
})