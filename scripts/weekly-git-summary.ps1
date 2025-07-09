#!/usr/bin/env pwsh
# Windows PowerShell 版本的 Git 提交记录汇总工具

# 将 Git Remote URL 转换为 HTTP URL 格式
function Convert-GitRemoteToUrl {
    param(
        [string]$RemoteInfo
    )
    
    # 提取远程名称和 URL 部分
    $parts = $RemoteInfo -split '\s+'
    $remoteUrl = $parts[1]
    
    # 检查 URL 是否包含 "git@"，如果是，则转换为 URL 格式，去除 .git 后缀
    if ($remoteUrl -match '^git@') {
        # 提取主机名和路径
        $hostPath = $remoteUrl -replace '^git@', '' -replace ':', '/' -replace '\.git$', ''
        # 将主机名和路径组合成 URL 格式
        $remoteUrl = $hostPath
    }
    
    # 输出转换后的结果
    return $remoteUrl
}

function Get-GitRemoteUrl {
    # 获取 git remote -v 信息
    $remoteInfo = git remote -v | Select-Object -First 1
    
    # 调用转换函数
    return Convert-GitRemoteToUrl $remoteInfo
}

# 生成 HTML 输出函数
function New-HtmlOutput {
    $scriptDir = Split-Path -Path $MyInvocation.ScriptName -Parent
    $templateFile = Join-Path $scriptDir "git-log.html"
    $outputFile = "git-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
    
    # 检查模板文件是否存在
    if (-not (Test-Path $templateFile)) {
        Write-Host "错误: 找不到 HTML 模板文件 $templateFile" -ForegroundColor $RED
        exit 1
    }
    
    # 重新运行脚本获取 JSON 数据
    $scriptArgs = @()
    if ($SEARCH_DIR -ne ".") {
        $scriptArgs += "--dir", "`"$SEARCH_DIR`""
    }
    if ($MONDAY) {
        $scriptArgs += "--since", "`"$MONDAY`""
    }
    if ($TODAY) {
        $scriptArgs += "--until", "`"$TODAY`""
    }
    if ($AUTHOR) {
        $scriptArgs += "--author", "`"$AUTHOR`""
    }
    $scriptArgs += "--json"
    
    $jsonData = & $MyInvocation.ScriptName @scriptArgs
    
    # 读取模板文件内容
    $templateContent = Get-Content $templateFile -Raw
    
    # 替换模板中的 STATIC_DATA
    $modifiedContent = $templateContent -replace 'const STATIC_DATA = ``;', "const STATIC_DATA = $jsonData;"
    
    $modifiedContent
    # 写入输出文件
    # $modifiedContent | Out-File -FilePath $outputFile -Encoding UTF8
    
    # Write-Host "HTML 文件已生成: $outputFile" -ForegroundColor $GREEN
    # Write-Host "用浏览器打开查看: file://$(Resolve-Path $outputFile)" -ForegroundColor $BLUE
}

# 设置颜色
$BLUE = [System.ConsoleColor]::Blue
$GREEN = [System.ConsoleColor]::Green
$YELLOW = [System.ConsoleColor]::Yellow
$RED = [System.ConsoleColor]::Red

# 默认值
$SEARCH_DIR = "."
# 获取本周一的日期
# 先获取当前是周几（0=周日，1=周一，等等）
$CURRENT_WEEKDAY = [int](Get-Date).DayOfWeek.value__
# 计算到本周一的天数
$DAYS_TO_MONDAY = (($CURRENT_WEEKDAY + 6) % 7)
$MONDAY = (Get-Date).AddDays(-$DAYS_TO_MONDAY).ToString("yyyy-MM-dd")
$TODAY = (Get-Date).ToString("yyyy-MM-dd")
$AUTHOR = ""
$JSON_OUTPUT = $false
$MD_OUTPUT = $false
$HTML_OUTPUT = $false

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
    Write-Host "  --html             生成HTML可视化文件"
    Write-Host ""
    Write-Host "示例:" -ForegroundColor $YELLOW
    Write-Host "  .\weekly-git-summary.ps1 -dir C:\projects -since 2023-01-01 -until 2023-01-31"
    Write-Host "  .\weekly-git-summary.ps1 -author '张三' -since 2023-01-01"
    Write-Host "  .\weekly-git-summary.ps1 -json -since 2023-01-01"
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
        "--html" {
            $HTML_OUTPUT = $true
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
elseif ($HTML_OUTPUT) {
    # do nothing, HTML output will be generated later
    # 这里不需要输出任何内容，HTML 输出会在 New-HtmlOutput 函数中处理
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

# 查找所有Git仓库 (最大深度为2)
$gitDirs = Get-ChildItem -Path $SEARCH_DIR -Recurse -Force -Directory -ErrorAction SilentlyContinue -Depth 2 | 
Where-Object { $_.Name -eq ".git" }

foreach ($gitDir in $gitDirs) {
    # 进入仓库所在目录
    $repoPath = $gitDir.Parent.FullName
    $originalLocation = Get-Location
    Set-Location -Path $repoPath
    
    # 获取仓库名称
    $REPO_NAME = Split-Path -Leaf $repoPath
    # 解析项目 url
    $REPO_URL = Get-GitRemoteUrl
    
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
                url     = $REPO_URL
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
        elseif ($HTML_OUTPUT) {
            # do nothing, HTML output will be generated later
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
elseif ($HTML_OUTPUT) {
    # 生成HTML文件
    New-HtmlOutput
}
elseif ($MD_OUTPUT) {
    ""
    "---"
    "*工作内容汇总完成*"
}
else {
    Write-Host "===== 工作内容汇总完成 =====" -ForegroundColor $BLUE
}
