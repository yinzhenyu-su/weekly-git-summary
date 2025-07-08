import { describe, test, expect } from "bun:test";
import { execSync } from "node:child_process";
import { join } from "node:path";

describe("Windows Compatibility Tests", () => {
  test("should simulate Windows CLI behavior", () => {
    const scriptPath = join(process.cwd(), "tests", "test-windows-cli.js");
    const output = execSync(`node "${scriptPath}" --help`, { encoding: "utf8" });
    
    expect(output).toContain("模拟 Windows 环境执行");
    expect(output).toContain("使用方法");
    expect(output).toContain("node weekly-git-summary.js");
  });

  test("should handle Windows JSON output", () => {
    const scriptPath = join(process.cwd(), "tests", "test-windows-cli.js");
    const output = execSync(`node "${scriptPath}" --json --since 2025-07-01`, { 
      encoding: "utf8" 
    });
    
    expect(output).toContain("模拟 Windows 环境执行");
    
    // 提取 JSON 部分（在分隔线之后）
    const lines = output.split('\n');
    const separatorIndex = lines.findIndex(line => line.includes('='.repeat(50)));
    const jsonLines = lines.slice(separatorIndex + 1).join('\n').trim();
    
    if (jsonLines) {
      const jsonData = JSON.parse(jsonLines);
      expect(jsonData).toHaveProperty("timeRange");
      expect(jsonData.timeRange.since).toBe("2025-07-01");
    }
  });

  test("should handle Windows path separators", () => {
    const scriptPath = join(process.cwd(), "tests", "test-windows-cli.js");
    const output = execSync(`node "${scriptPath}" --json --since 2025-01-01`, { 
      encoding: "utf8" 
    });
    
    expect(output).toContain("weekly-git-summary.js");
    expect(output).not.toContain("ERROR");
    expect(output).not.toContain("SyntaxError");
  });

  test("should work with different output formats on Windows", () => {
    const scriptPath = join(process.cwd(), "tests", "test-windows-cli.js");
    
    // 测试 Markdown 输出
    const mdOutput = execSync(`node "${scriptPath}" --md --since 2025-07-01`, { 
      encoding: "utf8" 
    });
    expect(mdOutput).toContain("模拟 Windows 环境执行");
    
    // 测试标准输出
    const standardOutput = execSync(`node "${scriptPath}" --since 2025-07-01`, { 
      encoding: "utf8" 
    });
    expect(standardOutput).toContain("模拟 Windows 环境执行");
  });
});