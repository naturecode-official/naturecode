#!/bin/bash

# 简单推送脚本

echo "简单推送 NatureCode 到 GitHub"
echo "============================="
echo ""

echo "步骤 1: 生成 Personal Access Token"
echo "---------------------------------"
echo "1. 打开浏览器访问: https://github.com/settings/tokens"
echo "2. 点击 'Generate new token'"
echo "3. 选择 'repo' 权限"
echo "4. 点击 'Generate token'"
echo "5. 立即复制 token（只显示一次！）"
echo ""
read -p "按回车继续，确认已复制 token..."

echo ""
echo "步骤 2: 推送代码"
echo "---------------"
echo "即将运行: git push -u origin main"
echo ""
echo "当提示输入密码时，请粘贴您的 Personal Access Token"
echo "（密码输入不会显示字符，正常粘贴即可）"
echo ""
read -p "按回车开始推送..."

# 推送
git push -u origin main

echo ""
echo "步骤 3: 验证"
echo "-----------"
if [ $? -eq 0 ]; then
    echo " 推送成功！"
    echo ""
    echo "安装命令："
    echo "curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash"
    echo ""
    echo "测试命令："
    echo "curl -I https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh"
else
    echo " 推送失败"
    echo "可能的原因："
    echo "1. Token 错误或过期"
    echo "2. 没有推送权限"
    echo "3. 网络问题"
    echo ""
    echo "请检查："
    echo "1. Token 是否有 'repo' 权限"
    echo "2. 是否登录正确的 GitHub 账户"
    echo "3. 仓库是否存在: https://github.com/naturecode-official/naturecode"
fi