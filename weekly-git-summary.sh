#!/bin/bash

# 设置颜色
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 默认值
SEARCH_DIR="."
DEBUG_MODE=false
# 获取本周一的日期
# 先获取当前是周几（0-6，0 表示周日）
# 然后计算到本周一的偏移天数
CURRENT_WEEKDAY=$(date +%w)
DAYS_TO_MONDAY=$(( (($CURRENT_WEEKDAY + 6) % 7) ))
$DEBUG_MODE && echo "Debug: Current weekday is $CURRENT_WEEKDAY (0=Sunday, 1=Monday, etc.)"
$DEBUG_MODE && echo "Debug: Days to subtract to get to Monday: $DAYS_TO_MONDAY"
MONDAY=$(date -v-${DAYS_TO_MONDAY}d +%Y-%m-%d)
$DEBUG_MODE && echo "Debug: Calculated Monday as: $MONDAY"
TODAY=$(date +%Y-%m-%d)
$DEBUG_MODE && echo "Debug: Today is: $TODAY"
AUTHOR=""
JSON_OUTPUT=false

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
    echo "  --debug           启用调试输出"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo "  $0 --dir ~/projects --since 2023-01-01 --until 2023-01-31"
    echo "  $0 --author '张三' --since 2023-01-01"
    echo "  $0 --json --since 2023-01-01"
    echo "  $0 --debug"
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
        --debug)
            DEBUG_MODE=true
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
find "$SEARCH_DIR" -type d -name ".git" | while read gitdir; do
    # 进入仓库所在目录
    cd "$(dirname "$gitdir")"
    
    # 获取仓库名称
    REPO_NAME=$(basename "$(pwd)")
    
    # 获取本周提交日志，添加作者过滤条件
    AUTHOR_FILTER=""
    if [ ! -z "$AUTHOR" ]; then
        AUTHOR_FILTER="--author=$AUTHOR"
    fi
    # 调整时间范围：从周一 00:00:00 到今天 23:59:59
    COMMITS=$(git log $AUTHOR_FILTER --since="${MONDAY} 00:00:00" --until="${TODAY} 23:59:59" --pretty=format:"%ad|%an|%s" --date=short)
    
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
            echo "      \"commits\": ["
            
            # 按日期分组处理提交
            COMMIT_COUNT=0
            CURRENT_DATE=""
            COMMIT_DATA=$(echo "$COMMITS" | while IFS="|" read -r date author message; do
                if [ "$date" != "$CURRENT_DATE" ]; then
                    if [ ! -z "$CURRENT_DATE" ]; then
                        echo "          ]"
                        echo "        },"
                    fi
                    CURRENT_DATE="$date"
                    echo "        {"
                    echo "          \"date\": \"$date\","
                    echo "          \"commits\": ["
                fi
                
                if [ $COMMIT_COUNT -gt 0 ]; then
                    echo ","
                fi
                COMMIT_COUNT=$((COMMIT_COUNT + 1))
                
                # 转义JSON中的特殊字符
                MESSAGE=$(echo "$message" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
                echo "            {"
                echo "              \"message\": \"$MESSAGE\","
                echo "              \"author\": \"$author\""
                echo -n "            }"
            done)
            
            # 处理最后一个日期组
            if [ ! -z "$COMMIT_DATA" ]; then
                echo "$COMMIT_DATA"
                echo ""
                echo "          ]"
                echo "        }"
            fi
            
            echo "      ]"
            echo -n "    }"
        else
            echo -e "${YELLOW}项目: $REPO_NAME${NC}"
            echo ""
            
            # 按日期分组显示提交
            CURRENT_DATE=""
            echo "$COMMITS" | while IFS="|" read -r date author message; do
                if [ "$date" != "$CURRENT_DATE" ]; then
                    echo -e "${GREEN}$date${NC}"
                    CURRENT_DATE="$date"
                fi
                echo "  • $message (作者: $author)"
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
else
    echo -e "${BLUE}===== 工作内容汇总完成 =====${NC}"
fi
