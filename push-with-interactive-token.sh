#!/bin/bash

# NatureCode GitHub 推送 - 交互式 Token 输入
echo "=== NatureCode GitHub 推送助手 ==="
echo "版本: 1.4.5.2"
echo "仓库: naturecode-official/naturecode"
echo "分支: main"
echo ""

# 显示当前状态
echo "📊 当前提交:"
git log --oneline -3
echo ""

echo "📁 待推送的文件:"
git status --short
echo ""

# 显示 Token 生成指南
echo "🔑 GitHub Personal Access Token 生成指南:"
echo "1. 访问: https://github.com/settings/tokens"
echo "2. 点击 'Generate new token (classic)'"
echo "3. 选择权限: repo (Full control of private repositories)"
echo "4. 设置有效期: 建议 90 天或无期限"
echo "5. 生成并立即复制 Token"
echo ""

# 交互式输入 Token
read -sp "请输入您的 GitHub Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ 错误: Token 不能为空"
    exit 1
fi

# 验证 Token 格式（基本检查）
if [[ ${#GITHUB_TOKEN} -lt 20 ]]; then
    echo "⚠️  警告: Token 长度似乎过短，请确认是否正确"
    read -p "是否继续？(y/n): " CONFIRM
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
        echo "操作已取消"
        exit 0
    fi
fi

echo ""
echo "🚀 开始推送流程..."
echo ""

# 步骤 1: 显示推送信息
echo "📦 推送信息:"
echo "   用户: naturecode-official"
echo "   仓库: naturecode"
echo "   分支: main"
echo "   提交: $(git log --oneline -1)"
echo ""

# 步骤 2: 构建 Git URL
GIT_URL="https://naturecode-official:${GITHUB_TOKEN}@github.com/naturecode-official/naturecode.git"
echo "🔗 Git URL: https://naturecode-official:****@github.com/naturecode-official/naturecode.git"
echo ""

# 步骤 3: 尝试推送
echo "📤 正在推送代码..."
if git push "$GIT_URL" main; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    
    # 显示成功信息
    echo "🎉 NatureCode v1.4.5.2 已成功部署到 GitHub！"
    echo ""
    
    # 显示安装命令
    echo "📥 安装命令:"
    echo "curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash"
    echo ""
    
    # 显示其他安装方式
    echo "🔧 其他安装方式:"
    echo "  # 智能安装（推荐）"
    echo "  curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-smart.sh | bash"
    echo ""
    echo "  # 简单安装"
    echo "  curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash"
    echo ""
    
    # 显示仓库信息
    echo "🔗 仓库地址:"
    echo "  https://github.com/naturecode-official/naturecode"
    echo ""
    
    # 验证推送
    echo "🔍 验证推送结果..."
    git fetch origin 2>/dev/null
    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse origin/main 2>/dev/null || echo "")
    
    if [ -n "$REMOTE_COMMIT" ] && [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
        echo "✅ 验证成功: 本地和远程代码一致"
    else
        echo "⚠️  验证中... 可能需要稍等片刻"
    fi
    
    echo ""
    echo "🌟 部署完成！用户现在可以使用 curl 命令安装 NatureCode。"
    
else
    echo ""
    echo "❌ 推送失败"
    echo ""
    echo "🔧 故障排除:"
    echo "1. 检查 Token 权限（需要 repo 权限）"
    echo "2. 确认 Token 未过期"
    echo "3. 检查网络连接"
    echo "4. 确认仓库存在且有写入权限"
    echo ""
    echo "💡 建议:"
    echo "- 重新生成 Token"
    echo "- 检查 GitHub 用户名是否正确（naturecode-official）"
    echo "- 尝试手动推送:"
    echo "  git push https://naturecode-official:TOKEN@github.com/naturecode-official/naturecode.git main"
    exit 1
fi