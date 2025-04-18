import { mkdir, cp } from 'node:fs/promises'

// 构建 TypeScript 代码
await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "./build",
  target: "node",
  format: "esm",
})

// 复制脚本文件
await mkdir('./build/scripts', { recursive: true })
await cp('./src/scripts', './build/scripts', { recursive: true })

export {}