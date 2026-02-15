# NatureCode AI 助手守则检查清单

## 🚨 每次代码修改后必须检查

### 1. Emoji 检查 

- [ ] **代码文件**: 确保 .js, .ts, .sh, .json 文件中没有 Emoji
- [ ] **注释**: 代码注释中禁止 Emoji
- [ ] **字符串**: 代码字符串中禁止 Emoji
- [ ] **文档**: Markdown 中仅使用简单符号（），避免 😀 等表情

**快速检查命令**:

```bash
# 检查代码文件中的 Emoji
grep -r "[\U0001F300-\U0001F9FF]" src/ --include="*.js" --include="*.ts" && echo "发现 Emoji！" || echo "代码干净"

# 检查 Shell 脚本中的 Emoji
grep -r "[\U0001F300-\U0001F9FF]" *.sh && echo "发现 Emoji！" || echo "Shell 脚本干净"
```

### 2. 语言规范检查 

- [ ] **用户对话**: 使用中文与用户交流
- [ ] **代码内容**: 变量名、函数名、注释使用英文
- [ ] **错误消息**:
  - 用户界面: 友好中文提示
  - 技术日志: 英文错误代码
- [ ] **提交信息**: 英文描述更改内容

**语言检查示例**:

```javascript
//  正确 - 英文注释
function calculateTotal(price, quantity) {
  // Calculate total price including tax
  return price * quantity * 1.1;
}

//  错误 - 中文注释（代码中）
function 计算总额(价格, 数量) {
  // 计算含税总价 <- 禁止！
  return 价格 * 数量 * 1.1;
}
```

### 3. GitHub 推送流程 

- [ ] **添加文件**: `git add .`
- [ ] **提交更改**: `git commit -m "英文描述性信息"`
- [ ] **选择推送方法**（三选一）:

  ```bash
  # 方法 A: 交互式推送（推荐）
  ./push-with-interactive-token.sh

  # 方法 B: 简单推送
  ./push-simple.sh

  # 方法 C: 完整推送
  ./push-to-github-final.sh
  ```

- [ ] **输入 GitHub Token**: 从 https://github.com/settings/tokens 获取
- [ ] **验证推送成功**:
  ```bash
  git remote show origin
  curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash --dry-run
  ```

##  详细守则说明

### Emoji 政策详解

#### 允许使用的情况:

1. **用户界面符号**: CLI 输出中的简单符号增强可读性
   -  `` 快速操作
   -  `` 成功提示
   -  `` 错误提示
   -  `` 工具提示
   -  `📁` 文件操作

2. **文档符号**: Markdown 文档中的分类符号
   -  `##  功能特性`
   -  `##  安装指南`
   -  `## 🐛 故障排除`

#### 禁止使用的情况:

1. **代码内部**: 任何代码文件中禁止
   -  `console.log(" 操作成功！")`
   -  `//  这是一个函数`
   -  `const 🎯 = "target"`

2. **表情符号**: 所有表情符号禁止
   -  `😀 😃 😄 😁 😆 😅 😂 🤣`
   -  `🙂 🙃 😉 😊 😇 🥰 😍 🤩`
   -  `😘 😗 ☺️ 😚 😙 🥲 😋 😛`

### 语言规范详解

#### 代码编写:

- **变量名**: `camelCase` 英文
- **函数名**: `camelCase` 英文
- **类名**: `PascalCase` 英文
- **常量**: `UPPER_SNAKE_CASE` 英文
- **注释**: 英文，解释复杂逻辑

#### 用户交互:

- **CLI 输出**: 根据用户语言选择
- **帮助文本**: 中英双语或根据用户选择
- **错误提示**: 友好中文 + 英文错误代码

#### 文档:

- **技术文档**: 英文为主（API 文档、架构设计）
- **用户指南**: 中英双语或中文
- **README**: 中英双语，优先中文

### GitHub 推送详解

#### Token 准备:

1. **访问**: https://github.com/settings/tokens
2. **生成**: "Generate new token (classic)"
3. **权限**: 必须选择 `repo` (Full control)
4. **有效期**: 建议 90天，生产环境可无期限
5. **保存**: 立即复制并保存在安全地方

#### 推送脚本区别:

- **push-with-interactive-token.sh**: 交互式，适合 AI 助手使用
- **push-simple.sh**: 快速简单，适合小更改
- **push-to-github-final.sh**: 完整功能，支持多种认证方式

#### 推送验证:

1. **检查远程**: `git remote show origin`
2. **查看日志**: `git log --oneline --graph --all`
3. **测试安装**: 使用 curl 命令测试
4. **访问仓库**: https://github.com/naturecode-official/naturecode

##  快速命令参考

### Emoji 检查命令

```bash
# 检查所有文件
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.sh" -o -name "*.json" \) -exec grep -l "[\U0001F300-\U0001F9FF]" {} \;

# 检查特定目录
grep -r "[\U0001F300-\U0001F9FF]" src/ tests/ --include="*.js" --include="*.ts"
```

### 语言检查命令

```bash
# 检查中文注释
grep -r "[\u4e00-\u9fff]" src/ --include="*.js" --include="*.ts" | grep -v "test" | grep -v "node_modules"

# 检查提交信息语言
git log --oneline -5
```

### GitHub 推送命令

```bash
# 完整推送流程
git add .
git commit -m "fix: 修复颜色显示问题，使用 printf 替代 echo -e"
./push-with-interactive-token.sh

# 快速验证
git status
git log --oneline -3
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | head -5
```

##  常见错误和纠正

### Emoji 相关错误

- **错误**: 在代码中使用 `` 庆祝成功
- **纠正**: 使用 `` 或文字描述
- **错误**: 注释中使用 `` 表示快速
- **纠正**: 使用 `// Fast implementation` 或 ``

### 语言相关错误

- **错误**: 代码变量使用中文拼音
- **纠正**: 使用英文描述性名称
- **错误**: 错误消息只有英文技术信息
- **纠正**: 添加友好中文提示 + 英文错误代码

### 推送相关错误

- **错误**: 忘记推送代码到 GitHub
- **纠正**: 每次修改后立即推送
- **错误**: 使用错误的 Token 权限
- **纠正**: 确保 Token 有 `repo` 权限
- **错误**: 不验证推送结果
- **纠正**: 运行 curl 测试安装命令

## 📞 紧急情况处理

### 如果所有检查都失败:

1. **恢复备份**: `git checkout -- .`
2. **重新开始**: 遵循守则重新修改
3. **寻求帮助**: 查看 `whatisthis.md` 文档

### 如果推送失败:

1. **检查 Token**: 重新生成 Token
2. **检查网络**: 确保网络连接正常
3. **检查仓库**: 确认仓库存在且有权限
4. **使用备选方法**: 尝试不同的推送脚本

## 🎯 成功标准

完成以下所有项目即为成功:

1. [ ] **Emoji 检查通过**: 代码文件中没有 Emoji
2. [ ] **语言规范通过**: 代码英文，用户提示中文
3. [ ] **GitHub 推送成功**: 代码已推送到远程仓库
4. [ ] **安装命令工作**: curl 安装命令正常执行
5. [ ] **功能测试通过**: NatureCode 可正常安装运行

**记住**: 守则不是限制，而是保证项目质量和一致性的重要工具！
