# NatureCode GitHub 推送快速指南 (v1.4.6)

## 🚀 一键推送方法

### 方法1：手动Token推送（推荐，解决网络/SSL问题）

```bash
./push-with-manual-token.sh
```

**特点**：

- 安全：Token只在内存中使用
- 可靠：解决SSL/TLS连接问题
- 简单：粘贴Token即可

### 方法2：交互式推送

```bash
./push-with-interactive-token.sh
```

### 方法3：简单推送

```bash
./push-simple.sh
```

### 方法4：完整推送

```bash
./push-to-github-final.sh
```

## 📋 当前状态 (v1.4.6)

### 待推送的提交：

```
b322866 feat: add manual token push script and update documentation
bb6d943 docs: add update completion summary and push script
f7dc867 chore: update changelog with English default language changes
31ee074 docs: update documentation for English default language and v1.4.5.5 features
ee67445 test: update test script for English default language
e3b9b0f feat: change default language to English, let AI handle Chinese translation
56ccf93 test: add auto-install test script
```

### 主要更新内容：

1. **默认语言改为英文** - AI处理翻译
2. **文档全面更新** - 英文文档，中文指南
3. **手动Token推送** - 解决网络问题
4. **帮助系统改进** - 更好的用户体验

## 🔧 快速步骤

### 如果你有GitHub Token：

```bash
# 一步完成推送
./push-with-manual-token.sh
# 然后粘贴你的Token
```

### 如果没有Token：

1. 访问 https://github.com/settings/tokens
2. 生成新Token（classic）
3. 选择 `repo` 权限
4. 运行 `./push-with-manual-token.sh`
5. 粘贴Token

## 🎯 推送后验证

### 检查GitHub仓库

```bash
# 验证安装脚本
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-smart.sh | head -5

# 验证版本
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/package.json | grep version

# 验证文档
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/docs.md | grep -i "default language"
```

### 本地功能测试

```bash
# 测试版本
naturecode -v  # 应该显示 1.4.6

# 测试英文帮助
naturecode help "hello"

# 测试中文问题
naturecode help "你是谁"

# 测试配置帮助
naturecode help "how to configure"
```

## 📦 安装命令汇总

```bash
# 智能安装（推荐）
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-smart.sh | bash

# 安装后测试
naturecode -v
naturecode help "hello"
naturecode help "who are you"
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

- **不要将 Token 提交到代码仓库**
- **不要分享 Token**
- **定期更新 Token**
- \*\*在 `.gitignore` 中排除敏感文件
