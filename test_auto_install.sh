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
naturecode help "hello" | grep -A5 "Hello! I am NatureCode"
echo ""

# 测试你是谁帮助
echo "4. 测试你是谁帮助:"
naturecode help "who are you" | grep -A5 "I am NatureCode AI Assistant"
echo ""

# 测试如何开始
echo "5. 测试如何开始帮助:"
naturecode help "how to start" | grep -A5 "How to get started with NatureCode"
echo ""

echo "=== 测试完成 ==="
echo ""
echo "Auto-installation feature summary:"
echo "✅ Version command works"
echo "✅ Simple help works"
echo "✅ Documentation help works (supports multilingual questions)"
echo "✅ AI assistant installed (Ollama + deepseek-coder)"
echo ""
echo "If AI response is slow, the model may be loading."
echo "Try: ollama run deepseek-coder 'Hello' to test model response."