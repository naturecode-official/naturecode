#!/bin/bash

# NatureCode 本地安装脚本
# 避免网络连接问题

echo "NatureCode 本地安装脚本"
echo "========================"

# 检查是否在项目目录中
if [ ! -f "package.json" ]; then
    echo "错误：请在 NatureCode 项目目录中运行此脚本"
    echo "当前目录：$(pwd)"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误：Node.js 未安装"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "错误：npm 未安装"
    exit 1
fi

echo "1. 安装依赖..."
npm install

echo "2. 创建全局链接..."
npm link

echo "3. 验证安装..."
if command -v naturecode &> /dev/null; then
    echo "✅ NatureCode 安装成功！"
    echo ""
    echo "使用方法："
    echo "  naturecode --version    # 查看版本"
    echo "  naturecode model        # 配置 AI 模型"
    echo "  naturecode start        # 启动 AI 会话"
    echo "  naturecode help         # 查看帮助"
else
    echo "❌ 安装失败，请尝试："
    echo "  sudo npm link"
fi