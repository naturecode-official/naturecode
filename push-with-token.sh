#!/bin/bash

# 推送脚本 - 使用 Personal Access Token
echo "=== NatureCode GitHub 推送助手 ==="
echo "仓库: https://github.com/naturecode-official/naturecode"
echo "分支: main"
echo ""

# 检查是否已配置远程仓库
if ! git remote -v | grep -q "naturecode-official/naturecode"; then
    echo "❌ 错误: 远程仓库未正确配置"
    echo "请运行: git remote add origin https://github.com/naturecode-official/naturecode.git"
    exit 1
fi

echo "📦 当前提交:"
git log --oneline -3
echo ""

echo "📁 待推送的文件:"
git status --short
echo ""

# 询问用户是否有 Token
read -p "🔑 您有 GitHub Personal Access Token 吗？(y/n): " has_token

if [[ "$has_token" != "y" && "$has_token" != "Y" ]]; then
    echo ""
    echo "📋 请按照以下步骤生成 Token:"
    echo "1. 访问: https://github.com/settings/tokens"
    echo "2. 点击 'Generate new token (classic)'"
    echo "3. 选择权限: repo (Full control)"
    echo "4. 设置有效期: 建议 90 天"
    echo "5. 生成并复制 Token"
    echo ""
    read -p "按 Enter 继续生成 Token，或输入 Token 继续: " token_input
    
    if [[ -z "$token_input" ]]; then
        echo "请生成 Token 后重新运行此脚本"
        exit 0
    else
        TOKEN="$token_input"
    fi
else
    read -sp "🔐 请输入您的 Token: " TOKEN
    echo ""
fi

if [[ -z "$TOKEN" ]]; then
    echo "❌ 错误: Token 不能为空"
    exit 1
fi

# 尝试推送
echo ""
echo "🚀 正在推送代码到 GitHub..."
echo "使用 Token 认证..."

# 使用 Token 推送
GIT_URL="https://naturecode-official:${TOKEN}@github.com/naturecode-official/naturecode.git"

if git push "$GIT_URL" main; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "🎉 NatureCode 已上传到 GitHub！"
    echo "📥 安装命令:"
    echo "curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash"
    echo ""
    echo "🔗 仓库地址: https://github.com/naturecode-official/naturecode"
else
    echo ""
    echo "❌ 推送失败"
    echo "可能的原因:"
    echo "1. Token 权限不足（需要 repo 权限）"
    echo "2. Token 已过期"
    echo "3. 网络连接问题"
    echo ""
    echo "💡 建议:"
    echo "1. 检查 Token 权限"
    echo "2. 生成新的 Token"
    echo "3. 检查网络连接"
fi