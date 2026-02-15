#!/bin/bash

echo "=== 简单方法：创建新的干净提交 ==="
echo ""

# 创建新的干净分支
echo "1. 创建新的干净分支..."
git checkout --orphan clean-history
git add -A
git commit -m "NatureCode v1.4.5.3 - Complete professional installer with AI assistant rules"

echo ""
echo "2. 删除旧的主分支..."
git branch -D main

echo ""
echo "3. 重命名当前分支为主分支..."
git branch -m main

echo ""
echo "✅ 创建了干净的提交历史"
echo ""
echo "新的提交:"
git log --oneline
echo ""
echo "现在可以推送到GitHub（需要强制推送）:"
echo "  git push origin main --force"