#!/bin/bash

# NatureCode 简单推送脚本
# 使用: ./push-simple.sh

echo "=== NatureCode GitHub 推送 ==="
echo "版本: 1.4.5.2"
echo "仓库: naturecode-official/naturecode"
echo ""

# 检查 Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "错误: 当前目录不是 Git 仓库"
    exit 1
fi

# 显示状态
echo "当前分支: $(git branch --show-current)"
echo "未提交的更改:"
git status --short
echo ""

# 添加和提交
echo "添加文件..."
git add .

echo "提交更改..."
git commit -m "NatureCode v1.4.5.2 - Cross-platform AI assistant with smart installer" || {
    echo "提交失败或没有更改"
}

# 获取 Token
echo ""
echo "需要 GitHub Personal Access Token"
echo "生成地址: https://github.com/settings/tokens"
echo "需要的权限: repo (Full control)"
echo ""
read -sp "请输入 Token: " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "错误: Token 不能为空"
    exit 1
fi

# 推送
echo "正在推送到 GitHub..."
GIT_URL="https://naturecode-official:${TOKEN}@github.com/naturecode-official/naturecode.git"

if git push "$GIT_URL" main; then
    echo ""
    echo " 推送成功！"
    echo ""
    echo " NatureCode 已上传到 GitHub"
    echo ""
    echo "📥 安装命令:"
    echo "curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash"
    echo ""
    echo "🔗 仓库: https://github.com/naturecode-official/naturecode"
else
    echo ""
    echo " 推送失败"
    echo "可能原因:"
    echo "  1. Token 权限不足"
    echo "  2. Token 已过期"
    echo "  3. 网络问题"
fi