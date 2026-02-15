#!/bin/bash

# NatureCode 手动Token推送脚本
# 当自动推送失败时使用此脚本

set -e

echo "=== NatureCode 手动Token推送 ==="
echo "版本: 1.4.5.5"
echo "仓库: naturecode-official/naturecode"
echo "分支: main"
echo ""

# 显示待推送的提交
echo "📊 当前待推送的提交:"
git log --oneline origin/main..HEAD
echo ""

# 检查是否有待推送的提交
if [ -z "$(git log --oneline origin/main..HEAD)" ]; then
    echo "✅ 没有待推送的提交，所有更改已同步到GitHub。"
    exit 0
fi

echo "🔑 GitHub Token 生成指南:"
echo "1. 访问: https://github.com/settings/tokens"
echo "2. 点击 'Generate new token (classic)'"
echo "3. 选择权限: repo (Full control of private repositories)"
echo "4. 设置有效期: 建议 90 天"
echo "5. 生成并立即复制 Token"
echo ""

# 读取Token
read -p "请输入GitHub Personal Access Token: " GITHUB_TOKEN

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ 错误: Token 不能为空"
    exit 1
fi

echo ""
echo "🔄 准备推送..."

# 临时保存远程URL
ORIGINAL_REMOTE=$(git remote get-url origin)

# 使用Token构造新的远程URL
# 格式: https://{token}@github.com/{username}/{repo}.git
if [[ $ORIGINAL_REMOTE == https://github.com/* ]]; then
    # 提取仓库路径
    REPO_PATH=$(echo $ORIGINAL_REMOTE | sed 's|https://github.com/||')
    
    # 构造带Token的URL
    TOKEN_REMOTE="https://${GITHUB_TOKEN}@github.com/${REPO_PATH}"
    
    echo "使用Token URL: https://${GITHUB_TOKEN:0:8}...@github.com/${REPO_PATH}"
    
    # 临时更改远程URL
    git remote set-url origin "$TOKEN_REMOTE"
    
    # 尝试推送
    echo "🚀 正在推送..."
    if git push origin main; then
        echo ""
        echo "✅ 推送成功!"
        
        # 恢复原始远程URL
        git remote set-url origin "$ORIGINAL_REMOTE"
        
        echo ""
        echo "📋 验证推送:"
        echo "1. 检查GitHub仓库: https://github.com/naturecode-official/naturecode"
        echo "2. 验证安装命令:"
        echo "   curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-smart.sh | head -5"
        echo "3. 测试版本:"
        echo "   naturecode -v"
    else
        echo ""
        echo "❌ 推送失败"
        
        # 恢复原始远程URL
        git remote set-url origin "$ORIGINAL_REMOTE"
        
        echo "可能的原因:"
        echo "1. Token 权限不足 (需要 repo 权限)"
        echo "2. Token 已过期"
        echo "3. 网络连接问题"
        echo "4. 仓库权限问题"
        exit 1
    fi
else
    echo "❌ 错误: 不支持的远程URL格式: $ORIGINAL_REMOTE"
    echo "请确保远程仓库使用HTTPS格式"
    exit 1
fi

echo ""
echo "🔒 安全提醒:"
echo "• Token 已从内存中清除"
echo "• 建议在GitHub上设置Token有效期"
echo "• 不要将Token提交到代码仓库"
echo "• 使用后可在GitHub上撤销Token"