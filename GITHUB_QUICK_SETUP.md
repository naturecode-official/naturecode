# GitHub Quick Setup for NatureCode

## 🚨 错误原因

您看到的错误是因为 GitHub 仓库还不存在：

```
curl: (56) The requested URL returned error: 404
```

##  快速设置步骤

### 步骤 1: 创建 GitHub 仓库

1. 访问: https://github.com/new
2. 填写信息:
   - **Owner**: `naturecode-official` (您需要先创建这个账户)
   - **Repository name**: `naturecode`
   - **Description**: Cross-platform terminal AI assistant
   - **Public** repository
   - 不要初始化 README、.gitignore 或 license
3. 点击 "Create repository"

### 步骤 2: 本地测试 (先做这个)

```bash
# 在项目目录中运行本地测试安装
cd /Users/jay5/Desktop/naturecode
chmod +x install-local-test.sh
./install-local-test.sh
```

### 步骤 3: 上传到 GitHub

```bash
# 在项目目录中执行
cd /Users/jay5/Desktop/naturecode

# 初始化 Git
git init

# 添加文件 (排除不需要的文件)
git add install*.sh
git add src/
git add package.json
git add *.md
git add docs/

# 提交
git commit -m "NatureCode v1.4.5.4 - Cross-platform AI assistant"

# 添加远程仓库 (替换为您的实际用户名)
git remote add origin https://github.com/naturecode-official/naturecode.git

# 推送
git branch -M main
git push -u origin main
```

### 步骤 4: 测试 GitHub 安装

```bash
# 等待几分钟让 GitHub 处理
# 然后测试安装
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
```

##  备选方案

### 方案 A: 使用现有用户名

如果您不想创建 `naturecode-official` 账户，可以：

1. 使用您现有的 GitHub 用户名
2. 更新所有脚本中的用户名：
   ```bash
   # 替换为您的用户名
   sed -i '' 's/naturecode-official/YOUR_USERNAME/g' install*.sh
   sed -i '' 's/naturecode-official/YOUR_USERNAME/g' *.md
   ```

### 方案 B: 本地安装测试

```bash
# 直接测试安装脚本
./install-smart.sh
./install-simple.sh
```

### 方案 C: 使用不同的安装方法

```bash
# 方法 1: 手动安装
npm install
npm install -g .

# 方法 2: 使用本地脚本
./install-local.sh
```

## 📁 必需上传的文件

### 核心文件 (必须上传)

```
install.sh              # 主安装器
install-smart.sh        # 智能安装器
package.json           # 项目配置
src/                   # 源代码
```

### 安装脚本 (建议上传)

```
install-simple.sh       # 简单安装器
install-universal.sh    # 通用安装器
install-curl.sh         # 高级安装器
```

### 文档 (建议上传)

```
README_INSTALL.md      # 安装指南
CURL_INSTALL.md        # Curl 安装指南
FINAL_INSTALL_COMMANDS.md # 最终命令
```

## 🐛 故障排除

### 如果 GitHub 404 错误持续

1. **检查仓库是否存在**:

   ```bash
   curl -I https://github.com/naturecode-official/naturecode
   ```

2. **检查文件是否存在**:

   ```bash
   curl -I https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh
   ```

3. **等待缓存更新**: GitHub 可能需要几分钟

### 如果无法创建 `naturecode-official` 账户

1. 用户名可能已被占用
2. 使用其他用户名，如 `naturecode-ai`、`naturecode-cli` 等
3. 更新所有脚本中的用户名

## 🎯 最小化设置

如果您想快速测试，只需要：

1. **创建仓库**: `yourusername/naturecode`
2. **上传核心文件**:
   ```bash
   git init
   git add install.sh install-smart.sh package.json src/
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/naturecode.git
   git push -u origin main
   ```
3. **测试**:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/yourusername/naturecode/main/install.sh | bash
   ```

## 📞 帮助

如果遇到问题：

1. **检查 GitHub 账户**: 确保您已登录
2. **检查仓库权限**: 确保仓库是公开的
3. **检查文件名**: 确保 `install.sh` 在仓库根目录
4. **等待几分钟**: GitHub 可能需要时间处理

##  立即行动

1. **先测试本地**:

   ```bash
   cd /Users/jay5/Desktop/naturecode
   ./install-local-test.sh
   ```

2. **然后创建 GitHub 仓库**

3. **最后测试在线安装**

这样您就能解决 404 错误了！
