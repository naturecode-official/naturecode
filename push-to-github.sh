#!/bin/bash

# NatureCode 推送到 GitHub 脚本

set -e

echo "NatureCode GitHub 推送助手"
echo "=========================="
echo ""

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "错误：请在 NatureCode 项目目录中运行此脚本"
    exit 1
fi

echo "1. 检查 Git 状态..."
git status --short
echo ""

echo "2. 检查远程仓库..."
git remote -v
echo ""

echo "3. 选择推送方式："
echo "   a) 使用 SSH (推荐)"
echo "   b) 使用 HTTPS + Personal Access Token"
echo "   c) 检查仓库是否存在"
echo "   d) 退出"
echo ""
read -p "请选择 [a-d]: " choice

case $choice in
    a)
        echo ""
        echo "使用 SSH 方式..."
        echo ""
        
        # 检查 SSH 密钥
        if [ ! -f ~/.ssh/id_ed25519.pub ] && [ ! -f ~/.ssh/id_rsa.pub ]; then
            echo "未找到 SSH 密钥，正在生成..."
            ssh-keygen -t ed25519 -C "shortsubjayfire@gmail.com" -f ~/.ssh/id_ed25519 -N ""
            echo ""
            echo "请将以下公钥添加到 GitHub："
            echo "1. 访问: https://github.com/settings/keys"
            echo "2. 点击 'New SSH key'"
            echo "3. 粘贴以下内容："
            echo ""
            cat ~/.ssh/id_ed25519.pub
            echo ""
            read -p "按回车继续，确认已添加 SSH 密钥到 GitHub..."
        fi
        
        # 更新远程 URL
        git remote set-url origin git@github.com:naturecode-official/naturecode.git
        echo "远程 URL 已更新为 SSH"
        git remote -v
        echo ""
        
        # 推送
        echo "正在推送到 GitHub..."
        git push -u origin main
        ;;
        
    b)
        echo ""
        echo "使用 HTTPS + Personal Access Token 方式..."
        echo ""
        echo "请生成 Personal Access Token："
        echo "1. 访问: https://github.com/settings/tokens"
        echo "2. 点击 'Generate new token'"
        echo "3. 选择 'repo' 权限"
        echo "4. 生成并复制 token"
        echo ""
        read -p "按回车继续，确认已生成 token..."
        
        # 推送（会提示输入用户名和密码/Token）
        echo "正在推送到 GitHub..."
        echo "用户名: naturecode-official"
        echo "密码: 粘贴您的 Personal Access Token"
        echo ""
        git push -u origin main
        ;;
        
    c)
        echo ""
        echo "检查仓库是否存在..."
        echo "请打开浏览器访问："
        echo "https://github.com/naturecode-official/naturecode"
        echo ""
        echo "如果看到 404，需要创建仓库："
        echo "1. 访问: https://github.com/new"
        echo "2. Owner: naturecode-official"
        echo "3. Repository name: naturecode"
        echo "4. Public repository"
        echo "5. 不要初始化任何文件"
        echo "6. 点击 'Create repository'"
        echo ""
        read -p "按回车继续..."
        ;;
        
    d)
        echo "退出"
        exit 0
        ;;
        
    *)
        echo "无效选择"
        exit 1
        ;;
esac

echo ""
echo "推送完成！"
echo ""
echo "验证安装命令："
echo "curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh"
echo ""
echo "如果成功，应该能看到 install.sh 的内容"
echo ""
echo "完整的安装命令："
echo "curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash"