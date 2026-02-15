#!/bin/bash

echo "=== NatureCode 快速推送 ==="
echo "版本: 1.4.6"
echo ""

# 显示待推送的提交
echo "待推送的提交:"
git log --oneline origin/main..HEAD
echo ""

# 尝试推送
echo "尝试推送到 GitHub..."
if git push origin main; then
    echo ""
    echo "✅ 推送成功!"
    echo ""
    echo "验证安装命令:"
    echo "curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-smart.sh | head -5"
else
    echo ""
    echo "❌ 推送失败，请检查网络连接"
    echo "可以稍后手动运行: git push origin main"
fi