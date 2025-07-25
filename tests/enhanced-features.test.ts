import { describe, expect, test } from "bun:test";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

const buildDir = "./build";
const cliScript = join(buildDir, "weekly-git-summary.js");

describe("Enhanced Features Tests", () => {
  // Ensure build exists before running tests
  if (!existsSync(cliScript)) {
    throw new Error("Build file not found. Run 'bun run build' first.");
  }

  test("should show enhanced help with new options", () => {
    const result = execSync(`node ${cliScript} --help`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });

    expect(result).toContain("--message-pattern");
    expect(result).toContain("--conventional");
    expect(result).toContain("--time-range");
    expect(result).toContain("可选值: today, yesterday, this-week, last-week, this-month, last-month");
  });

  test("should handle message pattern filtering", () => {
    const result = execSync(
      `node ${cliScript} --message-pattern "Initial" --json --since 2025-01-01`,
      {
        encoding: "utf8",
        cwd: process.cwd(),
      }
    );

    const data = JSON.parse(result);
    expect(data).toHaveProperty("messagePattern", "Initial");
    expect(data).toHaveProperty("statistics");
    expect(data.statistics).toHaveProperty("totalCommits");
    expect(data.statistics).toHaveProperty("totalAuthors");
  });

  test("should handle conventional commits", () => {
    const result = execSync(
      `node ${cliScript} --conventional --json --since 2025-01-01`,
      {
        encoding: "utf8",
        cwd: process.cwd(),
      }
    );

    const data = JSON.parse(result);
    expect(data).toHaveProperty("statistics");
    
    // Check if any commits have type information
    if (data.repositories.length > 0) {
      const hasCommitsWithType = data.repositories.some((repo: any) =>
        repo.commits.some((dateCommit: any) =>
          dateCommit.commits.some((commit: any) => commit.type)
        )
      );
      
      if (hasCommitsWithType) {
        expect(data.statistics).toHaveProperty("commitsByType");
      }
    }
  });

  test("should handle time range presets", () => {
    const timeRanges = ["today", "yesterday", "this-week", "last-week", "this-month", "last-month"];
    
    for (const range of timeRanges) {
      const result = execSync(
        `node ${cliScript} --time-range ${range} --json`,
        {
          encoding: "utf8",
          cwd: process.cwd(),
        }
      );

      const data = JSON.parse(result);
      expect(data).toHaveProperty("timeRange");
      expect(data.timeRange).toHaveProperty("since");
      expect(data.timeRange).toHaveProperty("until");
      
      // Verify the dates are valid
      expect(data.timeRange.since).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(data.timeRange.until).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test("should combine multiple filters", () => {
    const result = execSync(
      `node ${cliScript} --message-pattern "refactor" --conventional --time-range this-month --json`,
      {
        encoding: "utf8",
        cwd: process.cwd(),
      }
    );

    const data = JSON.parse(result);
    expect(data).toHaveProperty("messagePattern", "refactor");
    expect(data).toHaveProperty("statistics");
    
    // If there are commits, check they have type information
    if (data.repositories.length > 0) {
      data.repositories.forEach((repo: any) => {
        repo.commits.forEach((dateCommit: any) => {
          dateCommit.commits.forEach((commit: any) => {
            expect(commit).toHaveProperty("type");
            expect(commit.message.toLowerCase()).toContain("refactor");
          });
        });
      });
    }
  });

  test("should handle regex patterns", () => {
    const result = execSync(
      `node ${cliScript} --message-pattern "^feat|^fix|^refactor" --json --since 2025-01-01`,
      {
        encoding: "utf8",
        cwd: process.cwd(),
      }
    );

    const data = JSON.parse(result);
    expect(data).toHaveProperty("messagePattern", "^feat|^fix|^refactor");
    
    // If there are commits, they should match the pattern
    if (data.repositories.length > 0) {
      data.repositories.forEach((repo: any) => {
        repo.commits.forEach((dateCommit: any) => {
          dateCommit.commits.forEach((commit: any) => {
            const pattern = /^feat|^fix|^refactor/i;
            expect(pattern.test(commit.message)).toBe(true);
          });
        });
      });
    }
  });

  test("should show statistics in text output", () => {
    const result = execSync(
      `node ${cliScript} --conventional --since 2025-01-01`,
      {
        encoding: "utf8",
        cwd: process.cwd(),
      }
    );

    expect(result).toContain("统计信息:");
    expect(result).toContain("总提交数:");
    expect(result).toContain("参与作者数:");
  });

  test("should show commit types in conventional mode", () => {
    const result = execSync(
      `node ${cliScript} --conventional --since 2025-01-01`,
      {
        encoding: "utf8",
        cwd: process.cwd(),
      }
    );

    // Should show commit type labels in brackets for conventional commits
    if (result.includes("refactor:")) {
      expect(result).toContain("[refactor]");
    }
  });

  test("should handle empty results gracefully", () => {
    const result = execSync(
      `node ${cliScript} --message-pattern "nonexistentpattern123" --json`,
      {
        encoding: "utf8",
        cwd: process.cwd(),
      }
    );

    const data = JSON.parse(result);
    expect(data).toHaveProperty("statistics");
    expect(data.statistics.totalCommits).toBe(0);
    expect(data.statistics.totalAuthors).toBe(0);
  });

  test("should validate time range preset values", () => {
    // Valid preset should work
    expect(() => {
      execSync(`node ${cliScript} --time-range this-week --json`, {
        encoding: "utf8",
        cwd: process.cwd(),
      });
    }).not.toThrow();

    // Invalid preset should fall back to default behavior
    const result = execSync(
      `node ${cliScript} --time-range invalid-preset --json`,
      {
        encoding: "utf8",
        cwd: process.cwd(),
      }
    );

    const data = JSON.parse(result);
    expect(data).toHaveProperty("timeRange");
    expect(data.timeRange).toHaveProperty("since");
    expect(data.timeRange).toHaveProperty("until");
  });
});