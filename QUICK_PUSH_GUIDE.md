# NatureCode GitHub 推送快速指南

## 已创建的推送脚本

1. **`push-to-github-final.sh`** - 完整功能推送脚本
   - 检查 Git 状态
   - 显示项目信息
   - 支持多种认证方式
   - 验证推送结果
   - 显示安装命令

2. **`push-simple.sh`** - 简单推送脚本
   - 快速添加和提交
   - 使用 Token 认证
   - 显示安装命令

3. **`push-with-token.sh`** - Token 专用推送脚本
   - 交互式 Token 输入
   - 详细的错误处理

## 快速开始

### 方法 1: 使用简单脚本（推荐）

```bash
./push-simple.sh
```

### 方法 2: 使用完整脚本

```bash
./push-to-github-final.sh
```

### 方法 3: 手动推送

```bash
# 1. 添加所有文件
git add .

# 2. 提交更改
git commit -m "NatureCode v1.4.5.4 - Cross-platform AI assistant with smart installer"

# 3. 使用 Token 推送（替换 YOUR_TOKEN）
git push https://naturecode-official:YOUR_TOKEN@github.com/naturecode-official/naturecode.git main
```

## GitHub Token 生成步骤

1. **访问 Token 页面**: https://github.com/settings/tokens
2. **点击**: "Generate new token" → "Generate new token (classic)"
3. **设置权限**:
   -  `repo` (Full control of private repositories)
   -  `workflow` (Update GitHub Action workflows)
4. **设置有效期**: 选择 "No expiration" 或 90 天
5. **生成并复制**: 立即复制 Token（页面关闭后无法查看）

## 推送后验证

推送成功后，测试安装命令:

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
```

## 项目信息

- **版本**: 1.4.5.4
- **GitHub 用户**: naturecode-official
- **仓库**: naturecode
- **分支**: main
- **远程地址**: https://github.com/naturecode-official/naturecode.git

## 安装命令汇总

```bash
# 主安装命令
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash

# 智能安装（推荐）
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-smart.sh | bash

# 简单安装
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash

# 通用安装
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-universal.sh | bash
```

## 故障排除

### 常见问题

1. **403 错误**: Token 权限不足或用户名错误
   - 确认 Token 有 `repo` 权限
   - 确认 GitHub 用户名是 `naturecode-official`

2. **认证失败**: 清除旧凭据

   ```bash
   # macOS
   git credential-osxkeychain erase
   host=github.com
   protocol=https

   # 或删除钥匙串中的 GitHub 凭据
   security delete-internet-password -s github.com
   ```

3. **推送被拒绝**: 分支保护或权限问题
   - 确认有推送权限到 `main` 分支
   - 确认仓库存在且可访问

### 验证推送成功

```bash
# 检查远程状态
git remote show origin

# 查看提交历史
git log --oneline --graph --decorate --all

# 拉取最新代码
git fetch origin
```

## 下一步

推送成功后:

1.  测试安装命令
2.  更新项目文档
3.  创建 release 版本
4.  宣传项目

## 安全提醒

-  **不要将 Token 提交到代码仓库**
-  **不要分享 Token**
-  **定期更新 Token**
-  \*\*在 `.gitignore` 中排除敏感文件
