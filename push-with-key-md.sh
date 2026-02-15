#!/bin/bash

# NatureCode GitHub 推送 - 使用 key.md 中的 Token
echo "=== NatureCode v1.4.5.4 GitHub 推送 ==="
echo "版本: 1.4.5.4"
echo "仓库: naturecode-official/naturecode"
echo "分支: main"
echo ""

# 检查 key.md 文件
TOKEN_FILE="key.md"
if [ ! -f "$TOKEN_FILE" ]; then
    echo " 错误: 未找到 $TOKEN_FILE 文件"
    echo "请创建 $TOKEN_FILE 文件，内容为您的 GitHub Token"
    exit 1
fi

# 从文件读取 Token
GITHUB_TOKEN=$(cat "$TOKEN_FILE" | tr -d '[:space:]')
echo " 从 $TOKEN_FILE 读取 Token"
echo " Token 长度: ${#GITHUB_TOKEN} 字符"

if [ -z "$GITHUB_TOKEN" ]; then
    echo " 错误: $TOKEN_FILE 文件为空"
    exit 1
fi

# 显示当前状态
echo ""
echo "📊 当前状态:"
echo "   分支: $(git branch --show-current)"
echo "   最新提交: $(git log --oneline -1)"
echo "   提交历史:"
git log --oneline -3
echo ""

# 确认推送
read -p " 是否推送 NatureCode v1.4.5.4 到 GitHub？(y/n): " CONFIRM_PUSH
if [[ "$CONFIRM_PUSH" != "y" && "$CONFIRM_PUSH" != "Y" ]]; then
    echo "操作已取消"
    exit 0
fi

echo ""
echo " 正在推送代码..."

# 构建 Git URL
GIT_URL="https://naturecode-official:${GITHUB_TOKEN}@github.com/naturecode-official/naturecode.git"

# 尝试推送
if git push "$GIT_URL" main; then
    echo ""
    echo " 推送成功！"
    echo ""
    
    # 显示成功信息
    echo " NatureCode v1.4.5.4 已成功部署到 GitHub！"
    echo ""
    
    # 显示安装命令
    echo "📥 安装命令:"
    echo "curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash"
    echo ""
    
    # 显示其他安装方式
    echo " 其他安装方式:"
    echo "  # 智能安装（推荐）"
    echo "  curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-smart.sh | bash"
    echo ""
    echo "  # 简单安装"
    echo "  curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash"
    echo ""
    echo "  # 无颜色安装"
    echo "  curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-no-color.sh | bash"
    echo ""
    
    # 显示仓库信息
    echo "🔗 仓库地址:"
    echo "  https://github.com/naturecode-official/naturecode"
    echo ""
    
    # 验证推送
    echo "🔍 验证推送结果..."
    sleep 2
    
    # 获取本地和远程提交
    LOCAL_COMMIT=$(git rev-parse HEAD)
    git fetch origin 2>/dev/null
    REMOTE_COMMIT=$(git rev-parse origin/main 2>/dev/null || echo "")
    
    if [ -n "$REMOTE_COMMIT" ] && [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
        echo " 验证成功: 本地和远程代码一致"
        echo "   提交哈希: ${LOCAL_COMMIT:0:8}"
    else
        echo "  验证状态:"
        echo "   本地提交: ${LOCAL_COMMIT:0:8}"
        if [ -n "$REMOTE_COMMIT" ]; then
            echo "   远程提交: ${REMOTE_COMMIT:0:8}"
        else
            echo "   远程提交: 获取中..."
        fi
    fi
    
    echo ""
    echo " 部署完成！NatureCode v1.4.5.4 现在可以通过 curl 一键安装。"
    
    # 安全建议
    echo ""
    echo " 安全建议:"
    echo "  1. 考虑删除 key.md 文件: rm key.md"
    echo "  2. Token 保存在安全的地方"
    echo "  3. 定期更新 Token（当前 Token 以 ghp_ 开头）"
    
else
    echo ""
    echo " 推送失败"
    echo ""
    echo " 故障排除:"
    echo "1. 检查 Token 权限（需要 repo 权限）"
    echo "2. 确认 Token 未过期（ghp_ 开头的 Token）"
    echo "3. 检查网络连接"
    echo "4. 确认仓库存在且有写入权限"
    echo ""
    echo "💡 建议:"
    echo "- 重新生成 Token: https://github.com/settings/tokens"
    echo "- 检查 GitHub 用户名: naturecode-official"
    echo "- 尝试其他推送脚本:"
    echo "  ./push-with-interactive-token.sh"
    echo "  ./push-simple.sh"
    exit 1
fi