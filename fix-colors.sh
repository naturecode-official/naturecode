#!/bin/bash

# 修复 install-smart.sh 的颜色问题
# 使用 printf 替代 echo -e

echo "正在修复 install-smart.sh..."

# 临时文件
TEMP_FILE=$(mktemp)

# 读取并修复文件
while IFS= read -r line; do
    # 替换 echo -e "${COLOR}text${NC}" 为 printf "%b" "${COLOR}text${NC}\n"
    if [[ "$line" =~ echo\ -e\ \"([^\"]*)\" ]]; then
        content="${BASH_REMATCH[1]}"
        # 检查是否包含颜色变量
        if [[ "$content" =~ \$\{[A-Z]+\} ]]; then
            # 替换为 printf
            line="        printf \"%b\" \"$content\\n\""
        fi
    fi
    echo "$line" >> "$TEMP_FILE"
done < install-smart.sh

# 替换原文件
mv "$TEMP_FILE" install-smart.sh
chmod +x install-smart.sh

echo "修复完成！"
