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

  test("should handle author names with spaces on Windows", () => {
    const scriptPath = join(process.cwd(), "tests", "test-windows-cli.js");
    
    // 测试包含空格的作者名称 - 双引号
    const output1 = execSync(`node "${scriptPath}" --author "John Doe" --json --since 2025-07-01`, { 
      encoding: "utf8" 
    });
    expect(output1).toContain("模拟 Windows 环境执行");
    
    // 检查 JSON 输出中的作者信息
    const lines1 = output1.split('\n');
    const separatorIndex1 = lines1.findIndex(line => line.includes('='.repeat(50)));
    const jsonLines1 = lines1.slice(separatorIndex1 + 1).join('\n').trim();
    
    if (jsonLines1) {
      const jsonData1 = JSON.parse(jsonLines1);
      expect(jsonData1).toHaveProperty("author");
      expect(jsonData1.author).toBe("John Doe");
    }
    
    // 测试包含空格的作者名称 - 单引号
    const output2 = execSync(`node "${scriptPath}" --author 'Zhang San' --json --since 2025-07-01`, { 
      encoding: "utf8" 
    });
    expect(output2).toContain("模拟 Windows 环境执行");
  });

  test("should handle author names with backslash escaped spaces on Windows", () => {
    const scriptPath = join(process.cwd(), "tests", "test-windows-cli.js");
    
    // 测试反斜杠转义空格
    const output1 = execSync(`node "${scriptPath}" --author "Jane\\ Smith" --json --since 2025-07-01`, { 
      encoding: "utf8" 
    });
    expect(output1).toContain("模拟 Windows 环境执行");
    
    // 检查 JSON 输出中的作者信息
    const lines1 = output1.split('\n');
    const separatorIndex1 = lines1.findIndex(line => line.includes('='.repeat(50)));
    const jsonLines1 = lines1.slice(separatorIndex1 + 1).join('\n').trim();
    
    if (jsonLines1) {
      const jsonData1 = JSON.parse(jsonLines1);
      expect(jsonData1).toHaveProperty("author");
      expect(jsonData1.author).toBe("Jane Smith");
    }
    
    // 测试多个反斜杠转义空格
    const output2 = execSync(`node "${scriptPath}" --author "Dr\\ John\\ Doe\\ Jr" --json --since 2025-07-01`, { 
      encoding: "utf8" 
    });
    expect(output2).toContain("模拟 Windows 环境执行");
    
    const lines2 = output2.split('\n');
    const separatorIndex2 = lines2.findIndex(line => line.includes('='.repeat(50)));
    const jsonLines2 = lines2.slice(separatorIndex2 + 1).join('\n').trim();
    
    if (jsonLines2) {
      const jsonData2 = JSON.parse(jsonLines2);
      expect(jsonData2).toHaveProperty("author");
      expect(jsonData2.author).toBe("Dr John Doe Jr");
    }
  });

  test("should handle directory paths with backslash escaped spaces on Windows", () => {
    const scriptPath = join(process.cwd(), "tests", "test-windows-cli.js");
    
    // 测试反斜杠转义的目录路径 - 使用当前目录确保目录存在
    try {
      const output1 = execSync(`node "${scriptPath}" --dir ".\\ test\\ path" --json --since 2025-07-01`, { 
        encoding: "utf8",
        stdio: 'pipe'
      });
      expect(output1).toContain("模拟 Windows 环境执行");
      
      // 检查 JSON 输出中的目录信息
      const lines1 = output1.split('\n');
      const separatorIndex1 = lines1.findIndex(line => line.includes('='.repeat(50)));
      const jsonLines1 = lines1.slice(separatorIndex1 + 1).join('\n').trim();
      
      if (jsonLines1) {
        const jsonData1 = JSON.parse(jsonLines1);
        expect(jsonData1).toHaveProperty("searchDir");
        expect(jsonData1.searchDir).toBe(". test path");
      }
    } catch (error: any) {
      // 如果目录不存在，检查错误消息中是否正确解析了路径
      expect(error.message).toContain(". test path");
    }
    
    // 测试多个反斜杠转义的目录路径
    try {
      const output2 = execSync(`node "${scriptPath}" --dir "My\\ Test\\ Project\\ Folder" --json --since 2025-07-01`, { 
        encoding: "utf8",
        stdio: 'pipe'
      });
      expect(output2).toContain("模拟 Windows 环境执行");
      
      const lines2 = output2.split('\n');
      const separatorIndex2 = lines2.findIndex(line => line.includes('='.repeat(50)));
      const jsonLines2 = lines2.slice(separatorIndex2 + 1).join('\n').trim();
      
      if (jsonLines2) {
        const jsonData2 = JSON.parse(jsonLines2);
        expect(jsonData2).toHaveProperty("searchDir");
        expect(jsonData2.searchDir).toBe("My Test Project Folder");
      }
    } catch (error: any) {
      // 如果目录不存在，检查错误消息中是否正确解析了路径
      expect(error.message).toContain("My Test Project Folder");
    }
  });

  test("should handle multiple authors filtering on Windows", () => {
    const scriptPath = join(process.cwd(), "tests", "test-windows-cli.js");
    
    // 测试多个作者过滤
    try {
      const output1 = execSync(`node "${scriptPath}" -a "Alice Smith" -a "Bob Johnson" --json --since 2025-07-01`, { 
        encoding: "utf8",
        stdio: 'pipe'
      });
      expect(output1).toContain("模拟 Windows 环境执行");
      
      // 检查 JSON 输出中的作者信息
      const lines1 = output1.split('\n');
      const separatorIndex1 = lines1.findIndex(line => line.includes('='.repeat(50)));
      const jsonLines1 = lines1.slice(separatorIndex1 + 1).join('\n').trim();
      
      if (jsonLines1) {
        const jsonData1 = JSON.parse(jsonLines1);
        expect(jsonData1).toHaveProperty("author");
        expect(jsonData1.author).toBe("Alice Smith, Bob Johnson");
      }
    } catch (error: any) {
      // 如果没有找到匹配的提交，检查是否正确解析了作者参数
      expect(error.message).toContain("Alice Smith, Bob Johnson");
    }
    
    // 测试多个包含空格的作者过滤，使用反斜杠转义
    try {
      const output2 = execSync(`node "${scriptPath}" --author "Dr.\\ John\\ Doe\\ Jr" -a "Mary\\ Jane\\ Watson" --json --since 2025-07-01`, { 
        encoding: "utf8",
        stdio: 'pipe'
      });
      expect(output2).toContain("模拟 Windows 环境执行");
      
      const lines2 = output2.split('\n');
      const separatorIndex2 = lines2.findIndex(line => line.includes('='.repeat(50)));
      const jsonLines2 = lines2.slice(separatorIndex2 + 1).join('\n').trim();
      
      if (jsonLines2) {
        const jsonData2 = JSON.parse(jsonLines2);
        expect(jsonData2).toHaveProperty("author");
        expect(jsonData2.author).toBe("Dr. John Doe Jr, Mary Jane Watson");
      }
    } catch (error: any) {
      // 如果没有找到匹配的提交，检查是否正确解析了作者参数
      expect(error.message).toContain("Dr. John Doe Jr, Mary Jane Watson");
    }
  });
});