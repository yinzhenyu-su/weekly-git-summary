import { build } from 'bun';
import { join } from 'node:path';
import { existsSync, mkdirSync, rmSync } from 'node:fs';

const buildDir = './build';
const scriptsDir = './scripts';

async function buildCli() {
  console.log('🏗️  开始构建 CLI 工具...');
  
  // 清理构建目录
  if (existsSync(buildDir)) {
    rmSync(buildDir, { recursive: true, force: true });
    console.log('🧹 清理构建目录');
  }
  
  // 创建构建目录
  mkdirSync(buildDir, { recursive: true });
  
  try {
    // 构建 CLI 入口文件
    const result = await build({
      entrypoints: [join(scriptsDir, 'cli.ts')],
      outdir: buildDir,
      target: 'node',
      format: 'esm',
      minify: false,
      sourcemap: 'none',
      splitting: false,
      external: [],
      naming: {
        entry: 'cli.js'
      }
    });
    
    if (result.success) {
      console.log('✅ CLI 工具构建成功');
      console.log(`📦 输出目录: ${buildDir}`);
      console.log(`🎯 入口文件: ${buildDir}/cli.js`);
    } else {
      console.error('❌ 构建失败');
      for (const log of result.logs) {
        console.error(log);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 构建过程中发生错误:', error);
    process.exit(1);
  }
}

// 执行构建
buildCli().catch(console.error);