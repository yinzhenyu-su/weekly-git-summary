#!/usr/bin/env node
// 跨平台 Git 提交记录汇总工具 - 统一使用 Node.js 实现
import { execSync } from "node:child_process";
import { platform } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function main() {
  const args = process.argv.slice(2);
  const currentPlatform = platform();

  // 构建参数字符串
  const argsString = args.join(" ");

  let scriptPath: string;
  let command: string;

  if (currentPlatform === "win32") {
    // Windows 系统使用 Node.js 脚本（不再依赖 PowerShell）
    scriptPath = join(__dirname, "weekly-git-summary.js");
    command = `node "${scriptPath}" ${argsString}`;
  } else {
    // macOS/Linux 系统优先使用 Shell 脚本，回退到 Node.js 脚本
    const shScriptPath = join(__dirname, "weekly-git-summary.sh");
    const jsScriptPath = join(__dirname, "weekly-git-summary.js");
    
    if (existsSync(shScriptPath)) {
      scriptPath = shScriptPath;
      command = `bash "${scriptPath}" ${argsString}`;
    } else {
      scriptPath = jsScriptPath;
      command = `node "${scriptPath}" ${argsString}`;
    }
  }

  // 检查脚本文件是否存在
  if (!existsSync(scriptPath)) {
    console.error(`错误: 找不到脚本文件 ${scriptPath}`);
    process.exit(1);
  }

  try {
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

main();
