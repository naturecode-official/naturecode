#!/bin/bash

# 测试版本修复

echo "=== 测试版本修复 ==="
echo ""

# 测试 get_latest_version 函数
echo "1. 测试 get_latest_version 函数:"
source install-smart.sh >/dev/null 2>&1
LATEST_VERSION=$(get_latest_version)
echo "   最新版本: $LATEST_VERSION"
echo ""

# 测试 version_compare 函数
echo "2. 测试 version_compare 函数:"
echo "   1.4.5.4 < 1.4.6:"
if version_compare "1.4.5.4" "1.4.6"; then
    echo "   ✓ 正确: 1.4.5.4 比 1.4.6 旧"
else
    echo "   ✗ 错误: 版本比较失败"
fi

echo ""
echo "   1.4.6 < 1.4.5.4:"
if version_compare "1.4.6" "1.4.5.4"; then
    echo "   ✗ 错误: 1.4.6 不应该比 1.4.5.4 旧"
else
    echo "   ✓ 正确: 1.4.6 比 1.4.5.4 新"
fi

echo ""
echo "   1.4.6 = 1.4.6:"
if version_compare "1.4.6" "1.4.6"; then
    echo "   ✗ 错误: 相同版本不应该返回 true"
else
    echo "   ✓ 正确: 相同版本返回 false"
fi

echo ""
echo "=== 测试完成 ==="