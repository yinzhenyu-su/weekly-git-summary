#!/usr/bin/env node
// 测试 Windows 环境下的 CLI 行为
import { execSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function simulateWindowsCli() {
  const args = process.argv.slice(2);
  const argsString = args.join(" ");

  // 模拟 Windows 系统行为
  const scriptPath = join(__dirname, "..", "build", "weekly-git-summary.js");
  const command = `node "${scriptPath}" ${argsString}`;

  // 检查脚本文件是否存在
  if (!existsSync(scriptPath)) {
    console.error(`错误: 找不到脚本文件 ${scriptPath}`);
    process.exit(1);
  }

  try {
    console.log(`模拟 Windows 环境执行: ${command}`);
    console.log("=".repeat(50));
    
    // 执行对应的脚本
    execSync(command, {
      stdio: "inherit",
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error("脚本执行失败:", error);
    process.exit(1);
  }
}

simulateWindowsCli();