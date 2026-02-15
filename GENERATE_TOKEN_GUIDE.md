# GitHub Personal Access Token 生成指南

## 为什么需要 Token？

由于 Git 使用了错误的凭据（`cuiJY0111` 而不是 `naturecode-official`），导致 403 错误。需要生成 Token 来正确认证。

## 生成 Token 步骤

### 1. 访问 GitHub Token 页面

打开浏览器访问：https://github.com/settings/tokens

### 2. 生成新 Token

- 点击 "Generate new token"
- 选择 "Generate new token (classic)"

### 3. 配置 Token 权限

**必选权限：**

- ✅ `repo` (Full control of private repositories)
- ✅ `workflow` (Update GitHub Action workflows)

**可选权限（推荐）：**

- ✅ `write:packages` (Upload packages to GitHub Package Registry)
- ✅ `delete:packages` (Delete packages from GitHub Package Registry)
- ✅ `admin:org` (Full control of orgs and teams, read and write org projects)

### 4. 设置 Token 有效期

- 选择 "No expiration"（永不过期）或设置较长的有效期（如 90 天）

### 5. 生成并复制 Token

- 点击 "Generate token"
- **立即复制 Token**（页面关闭后将无法再次查看）
- 将 Token 保存在安全的地方

## 使用 Token 推送代码

### 方法 1：使用提供的脚本

```bash
# 运行推送脚本，它会提示输入 Token
./simple-push.sh
```

### 方法 2：手动推送

```bash
# 添加所有文件
git add .

# 提交更改
git commit -m "NatureCode v1.4.5.3 - Complete installation system"

# 使用 Token 推送（替换 YOUR_TOKEN）
git push https://naturecode-official:YOUR_TOKEN@github.com/naturecode-official/naturecode.git main
```

### 方法 3：配置 Git 凭据存储

```bash
# 配置 Git 使用 Token
git config --global credential.helper store

# 第一次推送时输入凭据
git push origin main
# 用户名：naturecode-official
# 密码：YOUR_TOKEN
```

## 验证推送成功

```bash
# 检查远程仓库状态
git remote show origin

# 查看推送日志
git log --oneline --graph --decorate --all
```

## 安装命令测试

推送成功后，测试安装命令：

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
```

## 安全注意事项

1. **不要将 Token 提交到代码仓库**
2. **不要将 Token 分享给他人**
3. **定期轮换 Token（如果设置了有效期）**
4. **在 .gitignore 中排除包含 Token 的文件**

## 问题排查

如果仍然遇到 403 错误：

1. 确认 Token 权限是否正确
2. 确认 GitHub 用户名是 `naturecode-official`
3. 确认仓库名称是 `naturecode`
4. 尝试清除 Git 凭据缓存：
   ```bash
   git credential-cache exit
   git config --global --unset credential.helper
   ```

## 完成后的下一步

1. ✅ 生成 Personal Access Token
2. ✅ 推送代码到 GitHub
3. ✅ 验证安装命令工作
4. ✅ 更新项目文档中的安装说明
5. ✅ 测试完整的安装流程
