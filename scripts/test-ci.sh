#!/bin/bash
# CI 测试脚本

set -e

echo "🧪 开始 CI 测试..."

# 构建项目
echo "🏗️  构建项目..."
bun run build.ts

# 测试帮助命令
echo "📋 测试帮助命令..."
node build/cli.js --help

# 测试 JSON 输出
echo "📄 测试 JSON 输出..."
OUTPUT=$(node build/cli.js --json --since 2023-01-01 --until 2023-12-31)
echo "$OUTPUT" | jq '.timeRange.since' | grep -q "2023-01-01"
echo "✅ JSON 输出测试通过"

# 测试 Markdown 输出
echo "📝 测试 Markdown 输出..."
node build/cli.js --md --since 2023-01-01 --until 2023-12-31 > /tmp/test-output.md
if [ -s /tmp/test-output.md ]; then
    echo "✅ Markdown 输出测试通过"
else
    echo "❌ Markdown 输出测试失败"
    exit 1
fi

# 测试 Node.js 脚本
echo "🔧 测试 Node.js 脚本..."
node build/weekly-git-summary.js --help

# 验证构建产物
echo "🔍 验证构建产物..."
if [ -f "build/cli.js" ] && [ -f "build/weekly-git-summary.js" ]; then
    echo "✅ 构建产物验证通过"
else
    echo "❌ 构建产物验证失败"
    exit 1
fi

# 测试跨平台功能
echo "🌍 测试跨平台功能..."
node build/cli.js --json --since 2025-01-01 | jq '.searchDir' | grep -q "\."
echo "✅ 跨平台功能测试通过"

echo "🎉 所有测试通过！"