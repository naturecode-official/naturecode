#!/bin/bash

# 修复 install-smart.sh 中的 echo -e 问题
# 使用 sed 批量替换 echo -e 为 printf "%b"

echo "正在修复 install-smart.sh 中的颜色显示问题..."

# 备份原文件
cp install-smart.sh install-smart.sh.backup

# 使用 sed 替换所有 echo -e "..." 为 printf "%b" "..."
# 注意：需要处理不同格式的 echo -e

# 1. 替换简单的 echo -e "${COLOR}text${NC}"
sed -i '' 's/echo -e "${\([A-Z]*\)}\([^"]*\)${NC}"/printf "%b" "${\\1}\\2${NC}"/g' install-smart.sh

# 2. 替换 echo -e "${COLOR}text"
sed -i '' 's/echo -e "${\([A-Z]*\)}\([^"]*\)"/printf "%b" "${\\1}\\2"/g' install-smart.sh

# 3. 替换 echo -e "text${COLOR}text"
sed -i '' 's/echo -e "\([^"]*\)${\([A-Z]*\)}\([^"]*\)"/printf "%b" "\\1${\\2}\\3"/g' install-smart.sh

# 4. 替换 echo -e "${COLOR}" 和 echo -e "${NC}"
sed -i '' 's/echo -e "${\([A-Z]*\)}"/printf "%b" "${\\1}"/g' install-smart.sh

# 5. 替换 echo -e "${COLOR}${BOLD}"
sed -i '' 's/echo -e "${\([A-Z]*\)}${\([A-Z]*\)}"/printf "%b" "${\\1}${\\2}"/g' install-smart.sh

echo "修复完成！"
echo "原文件已备份为 install-smart.sh.backup"