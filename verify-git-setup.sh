#!/bin/bash

echo "验证 Git 设置..."
echo "=================="
echo ""

echo "1. 当前目录:"
pwd
echo ""

echo "2. Git 配置:"
git config --list | grep -E "(user|email|remote)"
echo ""

echo "3. Git 状态:"
git status --short
echo ""

echo "4. 提交历史:"
git log --oneline -5
echo ""

echo "5. 远程仓库:"
git remote -v
echo ""

echo "6. 分支信息:"
git branch -a
echo ""

echo "7. 检查关键文件:"
ls -la install.sh install-smart.sh package.json src/cli/index.js
echo ""

echo "8. 测试 GitHub 连接:"
echo "   仓库 URL: https://github.com/naturecode-official/naturecode"
echo "   安装命令: curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash"
echo ""

echo "如果遇到 403 错误，请检查:"
echo "1. 仓库是否真的存在: https://github.com/naturecode-official/naturecode"
echo "2. 您是否已登录正确的 GitHub 账户"
echo "3. 您是否有推送权限"
echo "4. 尝试使用 Personal Access Token"
echo ""

echo "生成 Personal Access Token:"
echo "1. 访问: https://github.com/settings/tokens"
echo "2. 点击 'Generate new token'"
echo "3. 选择 'repo' 权限"
echo "4. 生成并复制 token"
echo "5. 在密码提示处粘贴 token"
echo ""

echo "或者使用 SSH:"
echo "1. 生成 SSH key: ssh-keygen -t ed25519 -C 'shortsubjayfire@gmail.com'"
echo "2. 添加到 GitHub: https://github.com/settings/keys"
echo "3. 更新远程 URL: git remote set-url origin git@github.com:naturecode-official/naturecode.git"
echo "4. 重新推送: git push -u origin main"