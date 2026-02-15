#!/bin/bash

echo "=== NatureCode GitHub 推送 ==="
echo "版本: 1.4.6"
echo "仓库: naturecode-official/naturecode"
echo ""

# 显示当前提交
echo "📊 当前提交:"
git log --oneline -3

echo ""
echo "🚀 准备推送到 GitHub..."

# 检查是否有未推送的提交
if git status | grep -q "Your branch is ahead"; then
    echo "有未推送的提交"
else
    echo "没有未推送的提交"
    exit 0
fi

echo ""
echo "需要 GitHub Personal Access Token"
echo "生成地址: https://github.com/settings/tokens"
echo "需要的权限: repo (Full control)"
echo ""
echo "请输入您的 GitHub Token:"
read TOKEN

if [ -z "$TOKEN" ]; then
    echo "错误: Token 不能为空"
    exit 1
fi

# 推送
echo ""
echo "正在推送到 GitHub..."
GIT_URL="https://naturecode-official:${TOKEN}@github.com/naturecode-official/naturecode.git"

if git push "$GIT_URL" main; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "📥 安装命令:"
    echo "curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash"
    echo ""
    echo "🔗 仓库: https://github.com/naturecode-official/naturecode"
else
    echo ""
    echo "❌ 推送失败"
    echo "可能原因:"
    echo "  1. Token 权限不足"
    echo "  2. Token 已过期"
    echo "  3. 网络问题"
fi