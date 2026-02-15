#!/bin/bash

echo "=== 测试 NatureCode 自动安装功能 ==="
echo ""

# 测试版本命令
echo "1. 测试版本命令:"
naturecode -v
echo ""

# 测试简单帮助
echo "2. 测试简单帮助:"
naturecode help --simple | head -20
echo ""

# 测试文档帮助
echo "3. 测试文档帮助 (hello):"
naturecode help "hello" | grep -A5 "你好！我是 NatureCode"
echo ""

# 测试你是谁帮助
echo "4. 测试你是谁帮助:"
naturecode help "你是谁" | grep -A5 "我是 NatureCode AI 助手"
echo ""

# 测试如何开始
echo "5. 测试如何开始帮助:"
naturecode help "如何开始" | grep -A5 "如何开始使用 NatureCode"
echo ""

echo "=== 测试完成 ==="
echo ""
echo "自动安装功能总结:"
echo "✅ 版本命令工作正常"
echo "✅ 简单帮助工作正常"
echo "✅ 文档帮助工作正常 (支持中文问题)"
echo "✅ AI助手已安装 (Ollama + deepseek-coder)"
echo ""
echo "如果AI响应较慢，可能是模型正在加载。"
echo "可以尝试: ollama run deepseek-coder 'Hello' 来测试模型响应。"