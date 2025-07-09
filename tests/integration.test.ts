import { describe, test, expect } from "bun:test";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

describe("Integration Tests", () => {
  test("should build successfully", () => {
    const result = execSync("bun run build.ts", { encoding: "utf8" });
    expect(result).toContain("构建成功");
  });

  test("should show help information", () => {
    const output = execSync("node build/cli.js --help", { encoding: "utf8" });
    expect(output).toContain("使用方法");
    expect(output).toContain("选项");
    expect(output).toContain("示例");
  });

  test("should generate JSON output", () => {
    const output = execSync("node build/cli.js --json --since 2023-01-01 --until 2023-12-31", { 
      encoding: "utf8" 
    });
    
    const jsonData = JSON.parse(output);
    expect(jsonData).toHaveProperty("timeRange");
    expect(jsonData.timeRange.since).toBe("2023-01-01");
    expect(jsonData.timeRange.until).toBe("2023-12-31");
    expect(jsonData).toHaveProperty("repositories");
  });

  test("should generate Markdown output", () => {
    const output = execSync("node build/cli.js --md --since 2023-01-01 --until 2023-12-31", { 
      encoding: "utf8" 
    });
    
    expect(output).toContain("# 工作内容Git提交记录汇总");
    expect(output).toContain("统计时间范围");
    expect(output.trim().length).toBeGreaterThan(0);
  });

  test("should generate HTML output", () => {
    const output = execSync("node build/cli.js --html --since 2025-07-01", { 
      encoding: "utf8" 
    });
    
    expect(output).toContain("<!DOCTYPE html>");
    expect(output).toContain("<title>");
    expect(output.length).toBeGreaterThan(1000); // HTML 文件应该比较大
  });

  test("should handle Node.js script directly", () => {
    const output = execSync("node build/weekly-git-summary.js --help", { encoding: "utf8" });
    expect(output).toContain("使用方法");
    expect(output).toContain("node weekly-git-summary.js");
  });

  test("should verify build artifacts", () => {
    expect(existsSync("build/cli.js")).toBe(true);
    expect(existsSync("build/weekly-git-summary.js")).toBe(true);
    expect(existsSync("build/weekly-git-summary.sh")).toBe(true);
  });

  test("should handle cross-platform functionality", () => {
    const output = execSync("node build/cli.js --json --since 2025-01-01", { 
      encoding: "utf8" 
    });
    
    const jsonData = JSON.parse(output);
    expect(jsonData.searchDir).toBe(".");
    expect(jsonData.timeRange.since).toBe("2025-01-01");
  });

  test("should handle author filter", () => {
    const output = execSync("node build/cli.js --json --author 'yinzhenyu' --since 2025-01-01", { 
      encoding: "utf8" 
    });
    
    const jsonData = JSON.parse(output);
    expect(jsonData).toHaveProperty("author");
    expect(jsonData.author).toBe("yinzhenyu");
  });

  test("should handle date range properly", () => {
    const output = execSync("node build/cli.js --json --since 2025-07-01 --until 2025-07-08", { 
      encoding: "utf8" 
    });
    
    const jsonData = JSON.parse(output);
    expect(jsonData.timeRange.since).toBe("2025-07-01");
    expect(jsonData.timeRange.until).toBe("2025-07-08");
  });
});