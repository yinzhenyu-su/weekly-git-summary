import { expect, test } from "bun:test";
import { main } from "../scripts";

test("node --help", () => {
  // 断言输出内容
  expect(main({ help: true })).toMatchInlineSnapshot(`
    "\x1B[34m使用方法:\x1B[0m
      weekly-git-summary.ts [选项]

    \x1B[32m选项:\x1B[0m
      -h, --help         显示此帮助信息
      -d, --dir DIR      指定搜索目录 (默认: 当前目录)
      -s, --since DATE   指定开始日期 (格式: YYYY-MM-DD, 默认: 本周一)
      -u, --until DATE   指定结束日期 (格式: YYYY-MM-DD, 默认: 今天)
      -a, --author NAME  只显示指定作者的提交
      -j, --json         以JSON格式输出结果
      -m, --md           以Markdown格式输出结果

    \x1B[33m示例:\x1B[0m
      weekly-git-summary.ts --dir ~/projects --since 2023-01-01 --until 2023-01-31
      weekly-git-summary.ts --author "张三" --since 2023-01-01
      weekly-git-summary.ts --json --since 2023-01-01"
  `);
});

test("node --dir --since --until", () => {
  // 断言输出内容
  expect(main({ since: "2024-01-02", until: "2025-04-17" }))
    .toMatchInlineSnapshot(`
    "\x1B[0;34m===== 工作内容Git提交记录汇总 =====\x1B[0m
    \x1B[0;32m统计时间范围:\x1B[0m 2024-01-02 到 2025-04-17
    \x1B[0;32m搜索目录:\x1B[0m .

    \x1B[0;34m===== 工作内容汇总完成 =====\x1B[0m
    "
  `);
});

test("node --dir --since --until --json", () => {
  // 断言输出内容
  expect(main({ since: "2024-01-02", until: "2025-04-17", json: true }))
    .toMatchInlineSnapshot(`
    "{
      "timeRange": {
        "since": "2024-01-02",
        "until": "2025-04-17"
      },
      "searchDir": ".",
      "repositories": [

      ]
    }
    "
  `);
});

test("node --dir --since --until --md", () => {
  // 断言输出内容
  expect(main({ since: "2024-01-02", until: "2025-04-17", md: true }))
    .toMatchInlineSnapshot(`
    "# 工作内容Git提交记录汇总

    - **统计时间范围**: 2024-01-02 到 2025-04-17
    - **搜索目录**: .


    ---
    *工作内容汇总完成*
    "
  `);
});

test("node --dir --since --until --author", () => {
  // 断言输出内容
  expect(main({ since: "2024-01-02", until: "2025-04-17", author: "notexist" }))
    .toMatchInlineSnapshot(`
    "\x1B[0;34m===== 工作内容Git提交记录汇总 =====\x1B[0m
    \x1B[0;32m统计时间范围:\x1B[0m 2024-01-02 到 2025-04-17
    \x1B[0;32m搜索目录:\x1B[0m .
    \x1B[0;32m作者过滤:\x1B[0m notexist

    \x1B[0;34m===== 工作内容汇总完成 =====\x1B[0m
    "
  `);
});
