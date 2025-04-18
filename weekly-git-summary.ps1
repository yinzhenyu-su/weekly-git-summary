# Windows PowerShell 版本的 Git 提交记录汇总工具

# 设置颜色
$BLUE = [System.ConsoleColor]::Blue
$GREEN = [System.ConsoleColor]::Green
$YELLOW = [System.ConsoleColor]::Yellow
$RED = [System.ConsoleColor]::Red

# 默认值
$SEARCH_DIR = "."
$DEBUG_MODE = $false
# 获取本周一的日期
# 先获取当前是周几（0=周日，1=周一，等等）
$CURRENT_WEEKDAY = [int](Get-Date).DayOfWeek.value__
if ($DEBUG_MODE) { Write-Host "Debug: Current weekday is $CURRENT_WEEKDAY (0=Sunday, 1=Monday, etc.)" }
# 计算到本周一的天数
$DAYS_TO_MONDAY = (($CURRENT_WEEKDAY + 6) % 7)
if ($DEBUG_MODE) { Write-Host "Debug: Days to subtract to get to Monday: $DAYS_TO_MONDAY" }
$MONDAY = (Get-Date).AddDays(-$DAYS_TO_MONDAY).ToString("yyyy-MM-dd")
if ($DEBUG_MODE) { Write-Host "Debug: Calculated Monday as: $MONDAY" }
$TODAY = (Get-Date).ToString("yyyy-MM-dd")
if ($DEBUG_MODE) { Write-Host "Debug: Today is: $TODAY" }
$AUTHOR = ""
$JSON_OUTPUT = $false
$MD_OUTPUT = $false

# 显示帮助信息
function Show-Help {
    Write-Host "使用方法:" -ForegroundColor $BLUE
    Write-Host "  .\weekly-git-summary.ps1 [选项]"
    Write-Host ""
    Write-Host "选项:" -ForegroundColor $GREEN
    Write-Host "  -h, --help         显示此帮助信息"
    Write-Host "  -d, --dir DIR      指定搜索目录 (默认: 当前目录)"
    Write-Host "  -s, --since DATE   指定开始日期 (格式: YYYY-MM-DD, 默认: 本周一)"
    Write-Host "  -u, --until DATE   指定结束日期 (格式: YYYY-MM-DD, 默认: 今天)"
    Write-Host "  -a, --author NAME  只显示指定作者的提交"
    Write-Host "  -j, --json         以JSON格式输出结果"
    Write-Host "  -m, --md           以Markdown格式输出结果"
    Write-Host "  --debug           启用调试输出"
    Write-Host ""
    Write-Host "示例:" -ForegroundColor $YELLOW
    Write-Host "  .\weekly-git-summary.ps1 -dir C:\projects -since 2023-01-01 -until 2023-01-31"
    Write-Host "  .\weekly-git-summary.ps1 -author '张三' -since 2023-01-01"
    Write-Host "  .\weekly-git-summary.ps1 -json -since 2023-01-01"
    Write-Host "  .\weekly-git-summary.ps1 --debug"
    exit
}

# 解析命令行参数
$i = 0
while ($i -lt $args.Count) {
    switch ($args[$i]) {
        { $_ -in ("-h", "--help") } {
            Show-Help
            break
        }
        { $_ -in ("-d", "--dir") } {
            $SEARCH_DIR = $args[$i + 1]
            $i += 2
            continue
        }
        { $_ -in ("-s", "--since") } {
            $MONDAY = $args[$i + 1]
            $i += 2
            continue
        }
        { $_ -in ("-u", "--until") } {
            $TODAY = $args[$i + 1]
            $i += 2
            continue
        }
        { $_ -in ("-a", "--author") } {
            $AUTHOR = $args[$i + 1]
            $i += 2
            continue
        }
        { $_ -in ("-j", "--json") } {
            $JSON_OUTPUT = $true
            $i += 1
            continue
        }
        { $_ -in ("-m", "--md") } {
            $MD_OUTPUT = $true
            $i += 1
            continue
        }
        "--debug" {
            $DEBUG_MODE = $true
            $i += 1
            continue
        }
        default {
            Write-Host "错误: 未知参数 $($args[$i])" -ForegroundColor $RED
            Show-Help
            exit 1
        }
    }
}

# 检查搜索目录是否存在
if (-not (Test-Path $SEARCH_DIR -PathType Container)) {
    Write-Host "错误: 目录 '$SEARCH_DIR' 不存在" -ForegroundColor $RED
    exit 1
}

# 如果是JSON输出，开始输出JSON对象
if ($JSON_OUTPUT) {
    $jsonOutput = [ordered]@{
        timeRange    = @{
            since = $MONDAY
            until = $TODAY
        }
        searchDir    = $SEARCH_DIR
        repositories = @()
    }
    
    if ($AUTHOR -ne "") {
        $jsonOutput.Add("author", $AUTHOR)
    }
}
elseif ($MD_OUTPUT) {
    "# 工作内容Git提交记录汇总"
    ""
    "- **统计时间范围**: $MONDAY 到 $TODAY"
    "- **搜索目录**: $SEARCH_DIR"
    if ($AUTHOR -ne "") {
        "- **作者过滤**: $AUTHOR"
    }
    ""
}
else {
    Write-Host "===== 工作内容Git提交记录汇总 =====" -ForegroundColor $BLUE
    Write-Host "统计时间范围: " -NoNewline -ForegroundColor $GREEN
    Write-Host "$MONDAY 到 $TODAY"
    Write-Host "搜索目录: " -NoNewline -ForegroundColor $GREEN
    Write-Host "$SEARCH_DIR"
    if ($AUTHOR -ne "") {
        Write-Host "作者过滤: " -NoNewline -ForegroundColor $GREEN
        Write-Host "$AUTHOR"
    }
    Write-Host ""
}

# 查找所有Git仓库
$gitDirs = Get-ChildItem -Path $SEARCH_DIR -Recurse -Force -Directory -ErrorAction SilentlyContinue | 
Where-Object { $_.Name -eq ".git" }

foreach ($gitDir in $gitDirs) {
    # 进入仓库所在目录
    $repoPath = $gitDir.Parent.FullName
    $originalLocation = Get-Location
    Set-Location -Path $repoPath
    
    # 获取仓库名称
    $REPO_NAME = Split-Path -Leaf $repoPath
    
    # 获取提交日志，添加作者过滤条件
    $gitLogArgs = @('log', "--since=$MONDAY 00:00:00", "--until=$TODAY 23:59:59", '--pretty=format:%ad|%an|%s|%h', '--date=short')
    if ($AUTHOR -ne "") {
        $gitLogArgs += "--author=$AUTHOR"
    }
    
    $COMMITS = git $gitLogArgs
    
    # 如果有提交，则显示仓库信息和提交
    if ($COMMITS) {
        if ($JSON_OUTPUT) {
            $repoData = @{
                name    = $REPO_NAME
                commits = @()
            }
            
            # 按日期分组处理提交
            $CURRENT_DATE = ""
            $dateCommits = $null
            
            foreach ($line in $COMMITS) {
                $parts = $line -split '\|'
                $date = $parts[0]
                $author = $parts[1]
                $message = $parts[2]
                $hash = $parts[3]
                
                if ($date -ne $CURRENT_DATE) {
                    # 保存之前的日期数据
                    if ($dateCommits) {
                        $repoData.commits += $dateCommits
                    }
                    
                    # 创建新的日期组
                    $CURRENT_DATE = $date
                    $dateCommits = @{
                        date    = $date
                        commits = @()
                    }
                }
                
                # 添加当前提交
                $dateCommits.commits += @{
                    message = $message
                    author  = $author
                    hash    = $hash
                }
            }
            
            # 添加最后一个日期组
            if ($dateCommits) {
                $repoData.commits += $dateCommits
            }
            
            # 添加仓库数据到输出
            $jsonOutput.repositories += $repoData
        }
        elseif ($MD_OUTPUT) {
            ""
            "## $REPO_NAME"
            ""
            
            # 按日期分组显示提交
            $CURRENT_DATE = ""
            foreach ($line in $COMMITS) {
                $parts = $line -split '\|'
                $date = $parts[0]
                $author = $parts[1]
                $message = $parts[2]
                $hash = $parts[3]
                
                if ($date -ne $CURRENT_DATE) {
                    "### $date"
                    $CURRENT_DATE = $date
                }
                "- $message (作者: $author, hash: $hash)"
            }
            ""
        }
        else {
            Write-Host "项目: $REPO_NAME" -ForegroundColor $YELLOW
            Write-Host ""
            
            # 按日期分组显示提交
            $CURRENT_DATE = ""
            foreach ($line in $COMMITS) {
                $parts = $line -split '\|'
                $date = $parts[0]
                $author = $parts[1]
                $message = $parts[2]
                $hash = $parts[3]
                
                if ($date -ne $CURRENT_DATE) {
                    Write-Host "$date" -ForegroundColor $GREEN
                    $CURRENT_DATE = $date
                }
                Write-Host "  • $message (作者: $author, hash: $hash)"
            }
            Write-Host ""
            Write-Host "-----------------------------------------"
            Write-Host ""
        }
    }
    
    # 返回原目录
    Set-Location -Path $originalLocation
}

# 输出最终的JSON或常规总结
if ($JSON_OUTPUT) {
    $jsonOutput | ConvertTo-Json -Depth 10
    # 不再显示常规总结
}
elseif ($MD_OUTPUT) {
    ""
    "---"
    "*工作内容汇总完成*"
}
else {
    Write-Host "===== 工作内容汇总完成 =====" -ForegroundColor $BLUE
}
