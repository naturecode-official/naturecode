#!/bin/bash

echo "=== 安全使用GitHub Token推送 ==="
echo ""

# 检查是否有Token
if [ ! -f "key.md" ]; then
    echo "❌ 未找到 key.md 文件"
    echo ""
    echo "请创建 key.md 文件并包含你的GitHub Token:"
    echo "  echo 'YOUR_GITHUB_TOKEN' > key.md"
    echo ""
    echo "或者直接输入Token:"
    read -sp "请输入GitHub Token: " GITHUB_TOKEN
    echo ""
    
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "❌ 未提供Token，无法推送"
        exit 1
    fi
else
    echo "✅ 从 key.md 读取Token"
    GITHUB_TOKEN=$(cat key.md | tr -d '[:space:]')
fi

# 验证Token格式
if [ ${#GITHUB_TOKEN} -lt 30 ]; then
    echo "❌ Token格式无效（太短）"
    exit 1
fi

echo "✅ Token长度: ${#GITHUB_TOKEN} 字符"
echo ""

# 使用Token配置Git
echo "配置Git使用Token..."
git remote set-url origin https://${GITHUB_TOKEN}@github.com/naturecode-official/naturecode.git

echo ""
echo "当前状态:"
git status
echo ""

echo "准备推送的提交:"
git log --oneline -3
echo ""

# 确认推送
read -p "推送这些更改到GitHub? [y/N]: " choice
if [[ ! "$choice" =~ ^[Yy]$ ]]; then
    echo "取消推送"
    exit 0
fi

echo ""
echo "开始推送..."
if git push origin main; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "GitHub仓库: https://github.com/naturecode-official/naturecode"
    echo "安装命令: curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash"
    
    # 清理Token（可选）
    echo ""
    read -p "删除 key.md 文件? [y/N]: " delete_choice
    if [[ "$delete_choice" =~ ^[Yy]$ ]]; then
        rm -f key.md
        echo "✅ key.md 已删除"
    fi
else
    echo ""
    echo "❌ 推送失败"
    echo "请检查:"
    echo "  1. Token是否有推送权限"
    echo "  2. 网络连接"
    echo "  3. 仓库是否存在"
fi

# 恢复原始远程URL（安全考虑）
git remote set-url origin https://github.com/naturecode-official/naturecode.git