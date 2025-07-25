# Weekly Git Summary - 新增功能说明

## 概述

本次更新为 weekly-git-summary 添加了多个实用的增强功能，旨在提升用户体验和工具的实用性。

## 新增功能

### 1. 提交信息模式过滤 (`--message-pattern`)

**功能描述**: 支持使用正则表达式或简单字符串模式过滤提交信息。

**使用方法**:
```bash
# 使用正则表达式过滤
weekly-git-summary --message-pattern "^feat|^fix"

# 简单字符串匹配
weekly-git-summary --message-pattern "bug"

# 不区分大小写的模式匹配
weekly-git-summary --message-pattern "Feature"
```

**应用场景**:
- 查找特定类型的提交（如功能添加、错误修复）
- 过滤包含特定关键词的提交
- 基于提交消息规范进行筛选

### 2. 传统提交规范支持 (`--conventional`)

**功能描述**: 自动识别和分类传统提交格式（Conventional Commits），提供按类型分组的统计信息。

**使用方法**:
```bash
# 启用传统提交解析
weekly-git-summary --conventional

# 结合其他选项使用
weekly-git-summary --conventional --json --time-range this-month
```

**支持的提交类型**:
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更改
- `style`: 代码格式修改
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `other`: 其他不符合传统规范的提交

**输出示例**:
```bash
# 文本输出
项目: my-project
2023-07-02
  • [feat] 添加用户认证功能 (作者: 张三, hash: abc123)
  • [fix] 修复登录页面样式问题 (作者: 李四, hash: def456)

统计信息:
  总提交数: 10
  参与作者数: 3
  提交类型分布:
    feat: 4
    fix: 3
    docs: 2
    refactor: 1
```

### 3. 时间范围预设 (`--time-range`)

**功能描述**: 提供常用时间范围的快捷选项，无需手动计算日期。

**可用预设**:
- `today`: 今天
- `yesterday`: 昨天  
- `this-week`: 本周（周一到今天）
- `last-week`: 上周（上周一到上周日）
- `this-month`: 本月（月初到今天）
- `last-month`: 上月（上月月初到月末）

**使用方法**:
```bash
# 查看本周提交
weekly-git-summary --time-range this-week

# 查看上个月的提交
weekly-git-summary --time-range last-month --json

# 结合其他过滤条件
weekly-git-summary --time-range last-week --author "张三" --conventional
```

### 4. 增强的统计信息

**功能描述**: 提供详细的提交统计信息，包括提交数量、参与人数和类型分布。

**统计内容**:
- 总提交数
- 参与作者数
- 提交类型分布（启用 `--conventional` 时）

**输出格式**:

*文本格式*:
```
统计信息:
  总提交数: 25
  参与作者数: 5
  提交类型分布:
    feat: 10
    fix: 8
    docs: 4
    refactor: 3
```

*JSON 格式*:
```json
{
  "statistics": {
    "totalCommits": 25,
    "totalAuthors": 5,
    "commitsByType": {
      "feat": 10,
      "fix": 8,
      "docs": 4,
      "refactor": 3
    }
  }
}
```

## 功能组合使用

所有新功能都可以自由组合使用，提供更精确的过滤和分析能力：

```bash
# 复杂过滤示例：查看上个月所有功能相关的提交
weekly-git-summary \
  --time-range last-month \
  --message-pattern "^feat" \
  --conventional \
  --json

# 团队生产力分析：查看特定作者本周的工作成果
weekly-git-summary \
  --time-range this-week \
  --author "张三" \
  --conventional \
  --md

# 质量分析：查看所有修复相关的提交
weekly-git-summary \
  --message-pattern "^fix|bug|修复" \
  --since 2023-01-01 \
  --conventional
```

## 向后兼容性

所有新功能都是向后兼容的：
- 现有的命令行参数保持不变
- 默认行为保持一致
- 输出格式在不使用新功能时与之前版本相同

## 性能优化

新功能的实现注重性能：
- 过滤操作在数据处理早期进行，减少不必要的计算
- 统计信息计算复用已有的数据结构
- 正则表达式编译进行了错误处理和回退机制

## 最佳实践

1. **使用预设时间范围**：对于常见的时间查询，使用预设选项比手动计算日期更方便且不易出错。

2. **结合传统提交规范**：如果团队使用传统提交规范，启用 `--conventional` 可以获得更有意义的统计信息。

3. **模式过滤优化**：使用具体的正则表达式模式可以更精确地过滤提交，避免误匹配。

4. **JSON输出分析**：对于需要进一步处理的场景，使用 JSON 输出格式便于与其他工具集成。

## 示例场景

### 场景1：每周工作汇报
```bash
weekly-git-summary --time-range this-week --conventional --md > weekly-report.md
```

### 场景2：发布前的提交类型统计
```bash
weekly-git-summary --since 2023-07-01 --conventional --json | jq '.statistics.commitsByType'
```

### 场景3：查找安全相关的提交
```bash
weekly-git-summary --message-pattern "security|secure|漏洞|安全" --since 2023-01-01
```

### 场景4：个人月度工作总结
```bash
weekly-git-summary --time-range this-month --author "$(git config user.name)" --conventional
```

这些新功能大大增强了 weekly-git-summary 的实用性和灵活性，使其能够更好地适应不同团队和项目的需求。