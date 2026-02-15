#!/bin/bash

# NatureCode GitHub 推送 - 使用文件中的 Token
echo "=== NatureCode v1.4.5.4 GitHub 推送 ==="
echo "仓库: naturecode-official/naturecode"
echo "分支: main"
echo ""

# 检查 Token 文件
TOKEN_FILE="tokenkey.txt"
if [ ! -f "$TOKEN_FILE" ]; then
    echo " 错误: 未找到 $TOKEN_FILE 文件"
    echo ""
    echo "请创建 $TOKEN_FILE 文件，内容为您的 GitHub Token:"
    echo "echo 'YOUR_GITHUB_TOKEN' > tokenkey.txt"
    echo ""
    echo "或者手动输入 Token:"
    read -sp "请输入 GitHub Token: " GITHUB_TOKEN
    echo ""
    
    if [ -z "$GITHUB_TOKEN" ]; then
        echo " 错误: Token 不能为空"
        exit 1
    fi
else
    # 从文件读取 Token
    GITHUB_TOKEN=$(cat "$TOKEN_FILE" | tr -d '[:space:]')
    echo " 从 $TOKEN_FILE 读取 Token"
    
    if [ -z "$GITHUB_TOKEN" ]; then
        echo " 错误: $TOKEN_FILE 文件为空"
        exit 1
    fi
fi

# 验证 Token 格式
echo " Token 长度: ${#GITHUB_TOKEN} 字符"
if [[ ${#GITHUB_TOKEN} -lt 20 ]]; then
    echo "  警告: Token 长度似乎过短"
    read -p "是否继续？(y/n): " CONFIRM
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
        echo "操作已取消"
        exit 0
    fi
fi

# 显示当前状态
echo ""
echo "📊 当前状态:"
echo "   分支: $(git branch --show-current)"
echo "   提交: $(git log --oneline -1)"
echo "   文件变更:"
git status --short
echo ""

# 确认推送
read -p "是否推送代码到 GitHub？(y/n): " CONFIRM_PUSH
if [[ "$CONFIRM_PUSH" != "y" && "$CONFIRM_PUSH" != "Y" ]]; then
    echo "操作已取消"
    exit 0
fi

echo ""
echo " 开始推送..."

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
    
    # 显示仓库信息
    echo "🔗 仓库地址:"
    echo "  https://github.com/naturecode-official/naturecode"
    echo ""
    
    # 验证推送
    echo "🔍 验证推送结果..."
    sleep 2
    git fetch origin 2>/dev/null
    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse origin/main 2>/dev/null || echo "")
    
    if [ -n "$REMOTE_COMMIT" ] && [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
        echo " 验证成功: 本地和远程代码一致"
    else
        echo "  验证中... 可能需要稍等片刻"
        echo "   本地提交: ${LOCAL_COMMIT:0:8}"
        if [ -n "$REMOTE_COMMIT" ]; then
            echo "   远程提交: ${REMOTE_COMMIT:0:8}"
        fi
    fi
    
    echo ""
    echo " 部署完成！用户现在可以使用 curl 命令安装 NatureCode v1.4.5.4。"
    
    # 安全建议
    echo ""
    echo " 安全建议:"
    echo "  1. 删除 tokenkey.txt 文件: rm tokenkey.txt"
    echo "  2. Token 保存在安全的地方"
    echo "  3. 定期更新 Token"
    
else
    echo ""
    echo " 推送失败"
    echo ""
    echo " 故障排除:"
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