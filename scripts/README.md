# tools

工作用脚本和工具

## weekly-git-summary.sh

生成本周 git 提交记录的总结。

```bash
./weekly-git-summary.sh
```

## weekly-git-summary.ps1

生成本周 git 提交记录的总结。

```powershell
.\weekly-git-summary.ps1
```

## 使用说明

### 参数说明

- `-d, --dir` 指定要搜索的目录，默认为当前目录。支持包含空格的路径，支持引号包裹和反斜杠转义两种方式。
- `-s, --since` 指定开始日期，格式为 `YYYY-MM-DD`，默认为本周一。
- `-u, --until` 指定结束日期，格式为 `YYYY-MM-DD`，默认为今天。
- `-a, --author` 指定作者，默认为所有作者。支持多个作者过滤（OR关系），支持包含空格的作者名称，支持引号包裹和反斜杠转义两种方式。
- `-j, --json` 以 JSON 格式输出结果。
- `-m --md` 以 Markdown 格式输出结果。
- `--html` 以 HTML 格式输出结果。
- `-h, --help` 显示帮助信息。

### 示例

- **linux/macOS**

```bash
./weekly-git-summary.sh -d ~/projects -s 2023-01-01 -u 2023-01-31

# 目录路径示例 - 支持包含空格的路径（多种转义方式）
./weekly-git-summary.sh -d "Program Files/MyProject"        # 引号包裹
./weekly-git-summary.sh --dir "My\ Documents/Projects"      # 引号内反斜杠转义
./weekly-git-summary.sh --dir "/Library/Application\ Support"  # 多个反斜杠转义

# 作者过滤示例 - 支持多个作者和空格名称（多种转义方式）
./weekly-git-summary.sh -a "John Doe"                      # 单个作者（引号包裹）
./weekly-git-summary.sh --author "Zhang San"               # 单个作者（引号包裹）
./weekly-git-summary.sh --author 'Li Ming Wang'            # 单个作者（单引号包裹）
./weekly-git-summary.sh -a "John\ Doe"                     # 单个作者（引号内反斜杠转义）
./weekly-git-summary.sh -a "Alice" -a "Bob"                # 多个作者过滤（OR关系）
./weekly-git-summary.sh -a "John Doe" --author "Jane Smith"    # 混合使用短参数和长参数
./weekly-git-summary.sh -a "Dr\ John\ Doe" -a "Mary\ Jane\ Watson"  # 多个作者反斜杠转义
```

- **windows**

```powershell
.\weekly-git-summary.ps1 -d ~/projects -s 2023-01-01 -u 2023-01-31

# 目录路径示例 - 支持包含空格的路径（多种转义方式）
.\weekly-git-summary.ps1 -d "C:\Program Files\MyProject"       # 引号包裹
.\weekly-git-summary.ps1 --dir "C:\Program\ Files\MyProject"   # 引号内反斜杠转义
.\weekly-git-summary.ps1 --dir "C:\Documents\ and\ Settings\User"  # 多个反斜杠转义

# 作者过滤示例 - 支持多个作者和空格名称（多种转义方式）
.\weekly-git-summary.ps1 -a "John Doe"                      # 单个作者（引号包裹）
.\weekly-git-summary.ps1 --author "Zhang San"               # 单个作者（引号包裹）
.\weekly-git-summary.ps1 --author 'Li Ming Wang'            # 单个作者（单引号包裹）
.\weekly-git-summary.ps1 -a "John\ Doe"                     # 单个作者（引号内反斜杠转义）
.\weekly-git-summary.ps1 -a "Alice" -a "Bob"                # 多个作者过滤（OR关系）
.\weekly-git-summary.ps1 -a "John Doe" --author "Jane Smith"    # 混合使用短参数和长参数
.\weekly-git-summary.ps1 -a "Dr\ John\ Doe" -a "Mary\ Jane\ Watson"  # 多个作者反斜杠转义
```

## 注意事项

- 需要先安装 git 命令行工具。
- windows 下可以使用 `weekly-git-summary.ps1` 脚本。
- windows 下需要安装 `git-bash` 才能使用 `weekly-git-summary.sh` 脚本。
- macos, linux 下可以使用 `weekly-git-summary.sh` 脚本。

## 图片

![weekly-git-summary](./dist/weekly-git-summary-1.png)

![weekly-git-summary](./dist/weekly-git-summary-2.png)

![weekly-git-summary](./dist/weekly-git-summary-3.png)
