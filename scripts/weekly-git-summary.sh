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
AUTHOR=""
JSON_OUTPUT=false
MD_OUTPUT=false
HTML_OUTPUT=false

# 生成 HTML 输出函数
generate_html_output() {
    local script_dir="$(dirname "$0")"
    local template_file="$script_dir/../git-log.html"
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
    if [ ! -z "$AUTHOR" ]; then
        args="$args --author \"$AUTHOR\""
    fi
    
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
    echo -e "${BLUE}使用方法:${NC}"
    echo "  $0 [选项]"
    echo ""
    echo -e "${GREEN}选项:${NC}"
    echo "  -h, --help         显示此帮助信息"
    echo "  -d, --dir DIR      指定搜索目录 (默认: 当前目录)"
    echo "  -s, --since DATE   指定开始日期 (格式: YYYY-MM-DD, 默认: 本周一)"
    echo "  -u, --until DATE   指定结束日期 (格式: YYYY-MM-DD, 默认: 今天)"
    echo "  -a, --author NAME  只显示指定作者的提交"
    echo "  -j, --json         以JSON格式输出结果"
    echo "  -m, --md           以Markdown格式输出结果"
    echo "  --html             生成HTML可视化文件"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo "  $0 --dir ~/projects --since 2023-01-01 --until 2023-01-31"
    echo "  $0 --author '张三' --since 2023-01-01"
    echo "  $0 --json --since 2023-01-01"
    exit 0
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            ;;
        -d|--dir)
            SEARCH_DIR="$2"
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
            AUTHOR="$2"
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
    if [ ! -z "$AUTHOR" ]; then
        echo "  \"author\": \"$AUTHOR\","
    fi
    echo '  "repositories": ['
elif [ "$MD_OUTPUT" = true ]; then
    echo "# 工作内容Git提交记录汇总"
    echo ""
    echo "- **统计时间范围**: $MONDAY 到 $TODAY"
    echo "- **搜索目录**: $SEARCH_DIR"
    if [ ! -z "$AUTHOR" ]; then
        echo "- **作者过滤**: $AUTHOR"
    fi
    echo ""
elif [ "$HTML_OUTPUT" = true ]; then
    echo ""
else
    echo -e "${BLUE}===== 工作内容Git提交记录汇总 =====${NC}"
    echo -e "${GREEN}统计时间范围:${NC} $MONDAY 到 $TODAY"
    echo -e "${GREEN}搜索目录:${NC} $SEARCH_DIR"
    if [ ! -z "$AUTHOR" ]; then
        echo -e "${GREEN}作者过滤:${NC} $AUTHOR"
    fi
    echo ""
fi

# 用于JSON格式的仓库计数器
REPO_COUNT=0

# 查找所有Git仓库
find "$SEARCH_DIR" -maxdepth 2 -type d -name ".git" | while read gitdir; do
    # 进入仓库所在目录
    cd "$(dirname "$gitdir")"
    
    # 获取仓库名称
    REPO_NAME=$(basename "$(pwd)")
    # 解析项目 url
    REPO_URL=$(convert_git_remote_to_url)
    
    # 获取本周提交日志，添加作者过滤条件$
    AUTHOR_FILTER=""
    if [ ! -z "$AUTHOR" ]; then
        AUTHOR_FILTER="--author=$AUTHOR"
    fi
    # 调整时间范围：从周一 00:00:00 到今天 23:59:59
    COMMITS=$(git log $AUTHOR_FILTER --since="${MONDAY} 00:00:00" --until="${TODAY} 23:59:59" --pretty=format:"%ad|%an|%s|%h" --date=short)
    
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
done

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
        echo "*工作内容汇总完成*"
    else
        echo -e "${BLUE}===== 工作内容汇总完成 =====${NC}"
    fi
fi
