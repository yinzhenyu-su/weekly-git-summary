#!/bin/bash

# Git URL 转换器函数
convert_to_url() {
    local remote_info="$1"
    
    # 提取远程名称和 URL 部分
    local remote_name=$(echo "$remote_info" | awk '{print $1}')
    local remote_url=$(echo "$remote_info" | awk '{print $2}')
    
    # 检查 URL 是否包含 "git@"，如果是，则转换为 URL 格式, 去除.git后缀
    if [[ "$remote_url" == git@* ]]; then
        # 提取主机名和路径
        local host_path=$(echo "$remote_url" | sed 's/git@//; s/:/\//; s/\.git$//')
        # 将主机名和路径组合成 URL 格式
        remote_url="$host_path"
    fi
    
    # 输出转换后的结果
    echo "$remote_url"
}

convert_git_remote_to_url() {
    # 获取 git remote -v 信息
    local remote_info=$(git remote -v | head -n 1)
    
    # 调用转换函数
    convert_to_url "$remote_info"
}

# 设置颜色
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 默认值
SEARCH_DIR="."
# 获取本周一的日期
# 先获取当前是周几（0-6，0 表示周日）
# 然后计算到本周一的偏移天数
CURRENT_WEEKDAY=$(date +%w)
DAYS_TO_MONDAY=$(( (($CURRENT_WEEKDAY + 6) % 7) ))
MONDAY=$(date -v-${DAYS_TO_MONDAY}d +%Y-%m-%d)
TODAY=$(date +%Y-%m-%d)
AUTHORS=()
JSON_OUTPUT=false
MD_OUTPUT=false
HTML_OUTPUT=false
LANG_OUTPUT="zh"

# 多语言翻译函数
translate() {
    local key="$1"
    local lang="${2:-$LANG_OUTPUT}"
    
    case $lang in
        "en")
            case $key in
                "usage") echo "Usage:" ;;
                "options") echo "Options:" ;;
                "examples") echo "Examples:" ;;
                "help") echo "Show this help message" ;;
                "dir") echo "Specify search directory (default: current directory)" ;;
                "since") echo "Specify start date (format: YYYY-MM-DD, default: this Monday)" ;;
                "until") echo "Specify end date (format: YYYY-MM-DD, default: today)" ;;
                "author") echo "Show commits by specified author only" ;;
                "json") echo "Output result in JSON format" ;;
                "markdown") echo "Output result in Markdown format" ;;
                "html") echo "Generate HTML visualization file" ;;
                "lang") echo "Set output language (zh|en, default: zh)" ;;
                "new_features") echo "New Features (automatically use Node.js version):" ;;
                "message_pattern") echo "Filter commit messages by pattern (supports regex)" ;;
                "conventional") echo "Enable conventional commits parsing and statistics" ;;
                "time_range") echo "Use preset time range (today, yesterday, this-week, last-week, this-month, last-month)" ;;
                "time_range_label") echo "Time Range" ;;
                "search_dir_label") echo "Search Directory" ;;
                "author_filter") echo "Author Filter" ;;
                "git_commit_summary") echo "Git Commit Summary" ;;
                "summary_completed") echo "Summary Completed" ;;
                "to") echo "to" ;;
                "author_text") echo "author" ;;
                *) echo "$key" ;;
            esac
            ;;
        *)
            case $key in
                "usage") echo "使用方法:" ;;
                "options") echo "选项:" ;;
                "examples") echo "示例:" ;;
                "help") echo "显示此帮助信息" ;;
                "dir") echo "指定搜索目录 (默认: 当前目录)" ;;
                "since") echo "指定开始日期 (格式: YYYY-MM-DD, 默认: 本周一)" ;;
                "until") echo "指定结束日期 (格式: YYYY-MM-DD, 默认: 今天)" ;;
                "author") echo "只显示指定作者的提交" ;;
                "json") echo "以JSON格式输出结果" ;;
                "markdown") echo "以Markdown格式输出结果" ;;
                "html") echo "生成HTML可视化文件" ;;
                "lang") echo "设置输出语言 (zh|en, 默认: zh)" ;;
                "new_features") echo "新功能 (自动使用 Node.js 版本):" ;;
                "message_pattern") echo "过滤符合模式的提交信息 (支持正则表达式)" ;;
                "conventional") echo "启用传统提交规范解析和统计" ;;
                "time_range") echo "使用预设时间范围 (today, yesterday, this-week, last-week, this-month, last-month)" ;;
                "time_range_label") echo "统计时间范围" ;;
                "search_dir_label") echo "搜索目录" ;;
                "author_filter") echo "作者过滤" ;;
                "git_commit_summary") echo "工作内容Git提交记录汇总" ;;
                "summary_completed") echo "工作内容汇总完成" ;;
                "to") echo "到" ;;
                "author_text") echo "作者" ;;
                *) echo "$key" ;;
            esac
            ;;
    esac
}

# 生成 HTML 输出函数
generate_html_output() {
    local script_dir="$(dirname "$0")"
    local template_file="$script_dir/git-log.html"
    local output_file="git-log-$(date +%Y%m%d-%H%M%S).html"
    
    # 检查模板文件是否存在
    if [ ! -f "$template_file" ]; then
        echo -e "${RED}错误: 找不到 HTML 模板文件 $template_file${NC}"
        exit 1
    fi
    
    # 重新运行脚本获取 JSON 数据
    local args=""
    if [ ! -z "$SEARCH_DIR" ] && [ "$SEARCH_DIR" != "." ]; then
        args="$args --dir \"$SEARCH_DIR\""
    fi
    if [ ! -z "$MONDAY" ]; then
        args="$args --since \"$MONDAY\""
    fi
    if [ ! -z "$TODAY" ]; then
        args="$args --until \"$TODAY\""
    fi
    for author in "${AUTHORS[@]}"; do
        if [ ! -z "$author" ]; then
            args="$args --author \"$author\""
        fi
    done
    
    # 转义`字符
    local json_data=$(eval "$0 $args --json" | sed 's/`/\\`/g')
    
    # 读取模板文件内容
    local template_content=$(cat "$template_file")
    
    # 替换模板中的 STATIC_DATA
    local modified_content="${template_content//const STATIC_DATA = \`\`;/const STATIC_DATA = $json_data;}"
    
    echo "$modified_content"
    # 写入输出文件
    # echo "$modified_content" > "$output_file"
    
    # echo -e "${GREEN}HTML 文件已生成: $output_file${NC}"
    # echo -e "${BLUE}用浏览器打开查看: file://$(realpath "$output_file")${NC}"
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}$(translate "usage"):${NC}"
    echo "  $0 [options]"
    echo ""
    echo -e "${GREEN}$(translate "options"):${NC}"
    echo "  -h, --help                    $(translate "help")"
    echo "  -d, --dir DIR                 $(translate "dir")"
    echo "  -s, --since DATE              $(translate "since")"
    echo "  -u, --until DATE              $(translate "until")"
    echo "  -a, --author NAME             $(translate "author")"
    echo "  -j, --json                    $(translate "json")"
    echo "  -m, --md                      $(translate "markdown")"
    echo "  --html                        $(translate "html")"
    echo "  --lang LANG                   $(translate "lang")"
    echo ""
    echo -e "${GREEN}$(translate "new_features")${NC}"
    echo "  --message-pattern PATTERN     $(translate "message_pattern")"
    echo "  --conventional                $(translate "conventional")"
    echo "  --time-range RANGE            $(translate "time_range")"
    echo ""
    echo -e "${YELLOW}$(translate "examples"):${NC}"
    if [ "$LANG_OUTPUT" = "en" ]; then
        echo "  $0 --dir ~/projects --since 2023-01-01 --until 2023-01-31"
        echo "  $0 --author 'John Doe' --since 2023-01-01"
        echo "  $0 --json --since 2023-01-01"
        echo "  $0 --time-range this-week --conventional"
        echo "  $0 --message-pattern \"feat|fix\" --json --lang en"
    else
        echo "  $0 --dir ~/projects --since 2023-01-01 --until 2023-01-31"
        echo "  $0 --author '张三' --since 2023-01-01"
        echo "  $0 --json --since 2023-01-01"
        echo "  $0 --time-range this-week --conventional"
        echo "  $0 --message-pattern \"feat|fix\" --json"
    fi
    exit 0
}

# 预先解析 --lang 参数以正确显示帮助信息
for arg in "$@"; do
    if [[ "$arg" == "--lang" ]]; then
        # 找到下一个参数作为语言设置
        for ((i=1; i<=$#; i++)); do
            if [[ "${!i}" == "--lang" ]]; then
                next_i=$((i+1))
                if [[ $next_i -le $# ]]; then
                    LANG_OUTPUT="${!next_i}"
                fi
                break
            fi
        done
        break
    fi
done

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            ;;
        -d|--dir)
            SEARCH_DIR="$2"
            # 处理反斜杠转义空格：将 "\ " 转换为空格
            SEARCH_DIR="${SEARCH_DIR//\\ / }"
            shift 2
            ;;
        -s|--since)
            MONDAY="$2"
            shift 2
            ;;
        -u|--until)
            TODAY="$2"
            shift 2
            ;;
        -a|--author)
            author="$2"
            # 处理反斜杠转义空格：将 "\ " 转换为空格
            author="${author//\\ / }"
            if [ ! -z "$author" ]; then
                AUTHORS+=("$author")
            fi
            shift 2
            ;;
        -j|--json)
            JSON_OUTPUT=true
            shift
            ;;
        -m|--md)
            MD_OUTPUT=true
            shift
            ;;
        --html)
            HTML_OUTPUT=true
            shift
            ;;
        --lang)
            LANG_OUTPUT="$2"
            if [[ "$LANG_OUTPUT" != "en" && "$LANG_OUTPUT" != "zh" ]]; then
                echo -e "${RED}Error: Unsupported language $LANG_OUTPUT, supported languages: zh, en${NC}"
                exit 1
            fi
            shift 2
            ;;
        --message-pattern|--conventional|--time-range)
            # 新功能参数，委托给 Node.js 版本处理
            
            # 检查 Node.js 版本是否存在
            SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
            NODE_SCRIPT="$SCRIPT_DIR/weekly-git-summary.js"
            
            if [ -f "$NODE_SCRIPT" ]; then
                # 将所有参数传递给 Node.js 版本
                exec node "$NODE_SCRIPT" "$@"
            else
                echo -e "${RED}错误: 找不到 Node.js 版本 ($NODE_SCRIPT)${NC}" >&2
                echo -e "${YELLOW}提示: 请运行 'bun run build.ts' 来构建 Node.js 版本${NC}" >&2
                exit 1
            fi
            ;;
        *)
            echo -e "${RED}错误: 未知参数 $1${NC}"
            show_help
            ;;
    esac
done

# 检查搜索目录是否存在
if [ ! -d "$SEARCH_DIR" ]; then
    echo -e "${RED}错误: 目录 '$SEARCH_DIR' 不存在${NC}"
    exit 1
fi

# 如果是JSON输出，开始输出JSON数组
if [ "$JSON_OUTPUT" = true ]; then
    echo '{'
    echo '  "timeRange": {'
    echo "    \"since\": \"$MONDAY\","
    echo "    \"until\": \"$TODAY\""
    echo '  },'
    echo "  \"searchDir\": \"$SEARCH_DIR\","
    if [ ${#AUTHORS[@]} -gt 0 ]; then
        authors_str=$(printf "%s, " "${AUTHORS[@]}")
        authors_str="${authors_str%, }"  # 去掉最后的逗号和空格
        echo "  \"author\": \"$authors_str\","
    fi
    echo '  "repositories": ['
elif [ "$MD_OUTPUT" = true ]; then
    echo "# $(translate "git_commit_summary")"
    echo ""
    echo "- **$(translate "time_range_label")**: $MONDAY $(translate "to") $TODAY"
    echo "- **$(translate "search_dir_label")**: $SEARCH_DIR"
    if [ ${#AUTHORS[@]} -gt 0 ]; then
        authors_str=$(printf "%s, " "${AUTHORS[@]}")
        authors_str="${authors_str%, }"  # 去掉最后的逗号和空格
        echo "- **$(translate "author_filter")**: $authors_str"
    fi
    echo ""
elif [ "$HTML_OUTPUT" = true ]; then
    echo ""
else
    echo -e "${BLUE}===== $(translate "git_commit_summary") =====${NC}"
    echo -e "${GREEN}$(translate "time_range_label"):${NC} $MONDAY $(translate "to") $TODAY"
    echo -e "${GREEN}$(translate "search_dir_label"):${NC} $SEARCH_DIR"
    if [ ${#AUTHORS[@]} -gt 0 ]; then
        authors_str=$(printf "%s, " "${AUTHORS[@]}")
        authors_str="${authors_str%, }"  # 去掉最后的逗号和空格
        echo -e "${GREEN}$(translate "author_filter"):${NC} $authors_str"
    fi
    echo ""
fi

# 用于JSON格式的仓库计数器
REPO_COUNT=0

# 查找所有Git仓库
while read gitdir; do
    # 进入仓库所在目录
    cd "$(dirname "$gitdir")"
    
    # 获取仓库名称
    REPO_NAME=$(basename "$(pwd)")
    # 解析项目 url
    REPO_URL=$(convert_git_remote_to_url)
    
    # 获取本周提交日志，添加作者过滤条件$
    AUTHOR_FILTERS=""
    for author in "${AUTHORS[@]}"; do
        if [ ! -z "$author" ]; then
            if [ -z "$AUTHOR_FILTERS" ]; then
                AUTHOR_FILTERS="--author=\"$author\""
            else
                AUTHOR_FILTERS="$AUTHOR_FILTERS --author=\"$author\""
            fi
        fi
    done
    # 调整时间范围：从周一 00:00:00 到今天 23:59:59
    if [ -z "$AUTHOR_FILTERS" ]; then
        COMMITS=$(git log --since="${MONDAY} 00:00:00" --until="${TODAY} 23:59:59" --pretty=format:"%ad|%an|%s|%h" --date=short)
    else
        COMMITS=$(eval "git log $AUTHOR_FILTERS --since=\"${MONDAY} 00:00:00\" --until=\"${TODAY} 23:59:59\" --pretty=format:\"%ad|%an|%s|%h\" --date=short")
    fi
    
    # 如果有提交，则显示仓库信息和提交
    if [ ! -z "$COMMITS" ]; then
        if [ "$JSON_OUTPUT" = true ]; then
            # 为非第一个仓库添加逗号
            if [ $REPO_COUNT -gt 0 ]; then
                echo ','
            fi
            REPO_COUNT=$((REPO_COUNT + 1))
            
            echo "    {"
            echo "      \"name\": \"$REPO_NAME\","
            echo "      \"url\": \"$REPO_URL\","
            echo "      \"commits\": ["
            

            # 按日期分组处理提交
            COMMIT_COUNT=0
            CURRENT_DATE=""
            # 初始化JSON字符串
            COMMIT_DATA=""
            CURRENT_DATE=""
            FIRST_DATE=true
            
            # 处理每个提交
            while IFS="|" read -r date author message hash; do
                # 新日期组开始
                if [ "$date" != "$CURRENT_DATE" ]; then
                    # 关闭前一个日期组
                    if [ "$FIRST_DATE" = false ]; then
                        COMMIT_DATA="${COMMIT_DATA}\n          ]\n        },"
                    fi
                    
                    # 开始新日期组
                    CURRENT_DATE="$date"
                    COMMIT_DATA="${COMMIT_DATA}\n        {\n          \"date\": \"$date\",\n          \"commits\": ["
                    FIRST_DATE=false
                    FIRST_COMMIT=true
                fi
                
                # 添加提交分隔符
                if [ "$FIRST_COMMIT" = false ]; then
                    COMMIT_DATA="${COMMIT_DATA},"
                fi
                FIRST_COMMIT=false
                
                # 添加提交内容
                MESSAGE=$(echo "$message" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
                COMMIT_DATA="${COMMIT_DATA}\n            {\n              \"message\": \"$MESSAGE\",\n              \"author\": \"$author\",\n              \"hash\": \"$hash\"\n            }"
            done <<< "$COMMITS"
            
            # 关闭最后一个日期组
            if [ "$FIRST_DATE" = false ]; then
                COMMIT_DATA="${COMMIT_DATA}\n          ]\n        }"
            fi
            
            # 处理最后一个日期组
            if [ ! -z "$COMMIT_DATA" ]; then
                echo -e "$COMMIT_DATA"
            else
                echo "        {"
                echo "          \"date\": \"$TODAY\","
                echo "          \"commits\": []"
                echo "        }"
            fi
            
            echo "      ]"
            echo "    }"
        elif [ "$MD_OUTPUT" = true ]; then
            echo ""
            echo "## $REPO_NAME"
            echo ""
            
            # 按日期分组显示提交
            CURRENT_DATE=""
            echo "$COMMITS" | while IFS="|" read -r date author message hash; do
                if [ "$date" != "$CURRENT_DATE" ]; then
                    echo "### $date"
                    CURRENT_DATE="$date"
                fi
                echo "- $message (作者: $author, hash: $hash)"
            done
            echo ""
        elif [ "$HTML_OUTPUT" = false ]; then
            echo -e "${YELLOW}项目: $REPO_NAME${NC}"
            echo ""
            
            # 按日期分组显示提交
            CURRENT_DATE=""
            echo "$COMMITS" | while IFS="|" read -r date author message hash; do
                if [ "$date" != "$CURRENT_DATE" ]; then
                    echo -e "${GREEN}$date${NC}"
                    CURRENT_DATE="$date"
                fi
                echo "  • $message (作者: $author, hash: $hash)"
            done
            
            echo ""
            echo "-----------------------------------------"
            echo ""
        fi
    fi
    
    # 返回原目录
    cd - > /dev/null
done < <(find "$SEARCH_DIR" -maxdepth 2 -type d -name ".git")

# 完成JSON输出
if [ "$JSON_OUTPUT" = true ]; then
    echo ""
    echo "  ]"
    echo "}"
elif [ "$HTML_OUTPUT" = true ]; then
    # 生成HTML文件
    generate_html_output
else
    if [ "$MD_OUTPUT" = true ]; then
        echo ""
        echo "---"
        echo "*$(translate "summary_completed")*"
    else
        echo -e "${BLUE}===== $(translate "summary_completed") =====${NC}"
    fi
fi
