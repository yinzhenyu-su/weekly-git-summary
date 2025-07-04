#!/usr/bin/env node
// 根据用户系统调用不同脚本，并传参
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
  const argsString = args.join(' ');
  
  let scriptPath: string;
  let command: string;
  
  if (currentPlatform === 'win32') {
    // Windows 系统使用 PowerShell 脚本
    scriptPath = join(__dirname, '..', 'scripts', 'weekly-git-summary.ps1');
    command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" ${argsString}`;
  } else {
    // macOS/Linux 系统使用 Shell 脚本
    scriptPath = join(__dirname, '..', 'scripts', 'weekly-git-summary.sh');
    command = `bash "${scriptPath}" ${argsString}`;
  }
  
  // 检查脚本文件是否存在
  if (!existsSync(scriptPath)) {
    console.error(`错误: 找不到脚本文件 ${scriptPath}`);
    process.exit(1);
  }
  
  try {
    // 执行对应的脚本
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error('脚本执行失败:', error);
    process.exit(1);
  }
}

main();
