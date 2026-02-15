#!/bin/bash

echo "=== 测试全局安装修复 ==="
echo ""

echo "1. 当前安装状态:"
which naturecode && naturecode --version || echo "未安装"
echo ""

echo "2. 卸载现有版本:"
npm uninstall -g naturecode 2>/dev/null || true
echo "✅ 已卸载"
echo ""

echo "3. 运行修复后的安装脚本:"
echo "临时目录问题已修复，现在使用永久目录: ~/.naturecode-install"
echo ""

# 运行修复后的安装脚本
bash /Users/jay5/Desktop/naturecode/install-smart.sh 2>&1 | grep -A5 -B5 "Installing globally\|permanent directory\|Global installation"

echo ""
echo "4. 验证安装:"
if command -v naturecode &> /dev/null; then
    echo "✅ naturecode 命令存在"
    echo "位置: $(which naturecode)"
    echo ""
    echo "符号链接目标:"
    ls -la /Users/jay5/.nvm/versions/node/v25.5.0/lib/node_modules/naturecode
    echo ""
    echo "版本:"
    naturecode --version
else
    echo "❌ naturecode 命令不存在"
fi

echo ""
echo "5. 永久目录检查:"
if [ -d "$HOME/.naturecode-install" ]; then
    echo "✅ 永久目录存在: $HOME/.naturecode-install"
    echo "内容:"
    ls -la "$HOME/.naturecode-install/" | head -5
else
    echo "❌ 永久目录不存在"
fi