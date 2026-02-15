#!/bin/bash

echo "=== 重写提交历史，移除前缀 ==="
echo ""

# 备份当前分支
BACKUP_BRANCH="backup-$(date +%s)"
echo "创建备份分支: $BACKUP_BRANCH"
git branch "$BACKUP_BRANCH"

# 交互式重写提交
echo ""
echo "开始重写提交历史..."
echo ""

# 使用 git filter-branch 重写提交信息
git filter-branch --msg-filter '
    # 移除常见的前缀
    sed -E "s/^(fix|chore|docs|feat|refactor|style|test|build|ci|perf|revert):\s*//i"
' -- --all

echo ""
echo "✅ 提交历史已重写"
echo ""
echo "新的提交历史:"
git log --oneline -10
echo ""
echo "⚠️  注意: 这改变了提交哈希，如果需要恢复，可以运行:"
echo "  git reset --hard $BACKUP_BRANCH"
echo ""
echo "如果要推送到GitHub，需要强制推送:"
echo "  git push origin main --force"