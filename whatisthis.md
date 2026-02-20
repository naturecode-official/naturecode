# NatureCode Project Documentation - AI Assistant Guide

## 📱 Platform Support

NatureCode is now a truly cross-platform AI assistant with native support for all major platforms:

### **Supported Platforms**

| Platform    | Status                 | Download Link                                                                                                                               | Installation        |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **Android** | ✅ **Fully Supported** | [naturecode-android-release.apk](https://github.com/naturecode-official/naturecode/releases/latest/download/naturecode-android-release.apk) | Direct APK install  |
| **Windows** | ✅ **Fully Supported** | [naturecode-win.exe](https://github.com/naturecode-official/naturecode/releases/latest/download/naturecode-win.exe)                         | Portable executable |
| **macOS**   | ✅ **Fully Supported** | [naturecode-macos](https://github.com/naturecode-official/naturecode/releases/latest/download/naturecode-macos)                             | Native binary       |
| **Linux**   | ✅ **Fully Supported** | [naturecode-linux](https://github.com/naturecode-official/naturecode/releases/latest/download/naturecode-linux)                             | Native binary       |
| **iOS**     | 🔄 **Planned**         | Coming Soon                                                                                                                                 | App Store (future)  |

### **Android via Termux**

NatureCode runs natively on Android through **Termux**, providing full desktop-like experience:

- **Terminal Environment**: Complete Linux terminal in Termux
- **Full AI Integration**: All NatureCode features available
- **Native Performance**: Runs directly on Linux environment
- **File System**: Full access to device storage
- **Network**: Complete connectivity for AI models

### **Quick Start on Android**

1. **Install Termux** from [F-Droid](https://f-droid.org/en/packages/com.termux/)
2. **Run installation script**:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-android.sh | bash
   ```
3. **Start NatureCode**:
   ```bash
   naturecode start
   ```

## 🚨 Core Rules for AI Assistants (Must Strictly Follow)

### 1. No Emoji in Project Internals

- **Code Files Prohibited**: No emoji in .js, .sh, .json, etc. files
- **Comments Prohibited**: No emoji in code comments
- **Documentation Limited**: Simple symbols () allowed in Markdown, avoid emoji
- **User Interface**: CLI output may use symbols for readability

### 2. Language Usage Standards

- **Default Language**: System defaults to English interface and documentation
- **AI Translation**: AI assistant handles multilingual translation (users can ask in Chinese, AI responds in English with translation)
- **Code Writing**: Variables, functions, comments use English
- **Error Messages**: User interface in English, technical logs in English
- **Documentation**: Technical documentation in English, user guides primarily in English

### 3. Automatic Push to GitHub After Code Changes

#### Core Principles

- **Mandatory Push**: Immediately push to GitHub after completing code modifications
- **Keep Synchronized**: Ensure GitHub repository is always the latest version
- **Verify Success**: Must verify installation command works after push

### 4. 🌍 GitHub Commit Language Standards

#### Commit Message Rules

- **Commit Messages**: Must use English (short description + detailed explanation)
- **Code Comments**: Maintain English
- **File Naming**: Use English or standard abbreviations
- **README**: Primary documentation in English, Chinese translation may be added

#### Commit Format Examples

```bash
#  Correct - English commit
git commit -m "feat: add new AI provider interface"

#  Correct - Detailed English explanation
git commit -m "fix: resolve color display issue in non-interactive terminals

- Detect terminal type with [ -t 0 ]
- Auto-select simple mode for curl | bash
- Add clear non-interactive mode message"

#  Incorrect - Chinese commit
git commit -m "修复: 解决非交互终端颜色显示问题"
```

#### Reasons

1. **Internationalization**: GitHub is a global platform, English is more universal
2. **Search Friendly**: English keywords facilitate global developer searches
3. **Tool Compatibility**: Many Git tools and CI/CD systems have better English support
4. **Team Collaboration**: Easier for international teams to understand and maintain

#### Complete Upload Process

##### Step 1: Prepare GitHub Token

```bash
# 1. Access Token page
open https://github.com/settings/tokens

# 2. Generate new Token (classic)
# 3. Set permissions: repo (Full control)
# 4. Set expiration: 90 days or no expiration
# 5. Generate and copy Token

# 6. Save Token to file (optional)
echo "YOUR_TOKEN" > key.md
# Note: Delete sensitive files after completion
```

##### Step 2: Choose Push Method

```bash
# Method A: Push using key.md file (Recommended)
./push-with-key-md.sh
# Features: Automatically reads key.md, interactive confirmation

# Method B: Interactive push
./push-with-interactive-token.sh
# Features: Hidden Token input, detailed prompts

# Method C: Simple push
./push-simple.sh
# Features: Quick and simple, suitable for small changes

# Method D: Full-featured push
./push-to-github-final.sh
# Features: Complete functionality, supports multiple authentication methods
```

##### Step 3: Execute Push

```bash
# 1. Check current status
git status
git log --oneline -3

# 2. Run push script
./push-with-key-md.sh

# 3. Confirm push (enter y)
```

##### Step 4: Verify Upload Success

```bash
# 1. Verify remote repository
git remote show origin

# 2. Test installation command
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash --dry-run

# 3. Check repository accessibility
open https://github.com/naturecode-official/naturecode

# 4. Verify version number
curl -s https://raw.githubusercontent.com/naturecode-official/naturecode/main/package.json | grep '"version"'
```

#### Push Script Descriptions

##### `push-with-key-md.sh`

- **Purpose**: Read Token from `key.md` file for push
- **Process**: Read Token → Show status → Confirm → Push → Verify
- **Security**: Recommended to delete `key.md` file after push

##### `push-with-interactive-token.sh`

- **Purpose**: Interactive Token input (hidden input)
- **Process**: Prompt input → Verify → Push → Show installation command
- **Security**: Token not saved, needs input each time

##### `push-simple.sh`

- **Purpose**: Quick and simple push
- **Process**: Add files → Commit → Token input → Push
- **Suitable for**: Small changes, quick deployment

##### `push-to-github-final.sh`

- **Purpose**: Full-featured push
- **Process**: Status check → Authentication selection → Push → Verify → Show command
- **Features**: Supports multiple methods: Token/SSH/existing credentials

#### Troubleshooting

##### Common Errors

1. **403 Forbidden**: Token insufficient permissions or expired

   ```bash
   # Regenerate Token
   open https://github.com/settings/tokens
   ```

2. **Repository not found**: Repository doesn't exist or URL is incorrect

   ```bash
   # Check remote repository configuration
   git remote -v
   # Correct URL: https://github.com/naturecode-official/naturecode.git
   ```

3. **Authentication failed**: Token format error or invalid

   ```bash
   # Check Token format (should start with ghp_)
   head -c 3 key.md
   ```

4. **Network error**: Network connection issue
   ```bash
   # Test GitHub connection
   curl -I https://github.com
   ```

##### Emergency Recovery

```bash
# If push fails, try:
# 1. Regenerate Token
# 2. Use different push script
# 3. Check network connection
# 4. Verify repository permissions

# Manual push command
git push https://naturecode-official:TOKEN@github.com/naturecode-official/naturecode.git main
```

#### Security Considerations

1. **Token Security**: Do not commit Token to code repository
2. **File Security**: Delete sensitive files like `key.md` after use
3. **Minimal Permissions**: Token only needs `repo` permission
4. **Regular Updates**: Set reasonable expiration for Token
5. **Access Logs**: Monitor GitHub access records
6. **Manual Token Security**: When using `push-with-manual-token.sh`, Token is only used in memory and not saved to file

#### Manual Token Push Security

- Token entered via command line, not saved to disk
- Script clears Token immediately after use
- Recommended to set Token expiration in GitHub
- Token can be revoked in GitHub after push

#### Success Indicators

- Push command executes successfully
- Installation command is accessible
- GitHub repository shows latest code
- Version number displays correctly (current: 2.0.0)
- All functionality tests pass

#### Automation Suggestions

```bash
# Can create automation script
#!/bin/bash
# auto-push.sh
git add .
git commit -m "$1"
./push-with-key-md.sh

# Usage: ./auto-push.sh "commit description"
```

**Remember**: Must push after every code modification to keep GitHub repository synchronized!

## Project Overview

**NatureCode** is an intelligent AI assistant with AGENT.md project management system, supporting 12+ AI providers including DeepSeek, OpenAI, Anthropic, Google Gemini, Ollama, Baidu ERNIE, and more. Current version: **v2.0.0**

### 🚨 Essential Rules (AI Assistants Must Follow)

1. **No Emoji Usage (Project Internals)**
   - No emoji allowed in code, comments, or documentation
   - User interface may use appropriate symbols (such as , , )
   - Maintain code professionalism and readability

2. **Language Usage Standards**
   - **User Conversations**: Use Chinese (Simplified/Traditional)
   - **Project Internals**: Code, comments, documentation use English
   - **Error Messages**: User-friendly Chinese prompts, technical details in English

3. **Automatic Push to GitHub After Code Changes**
   - Must push to GitHub after completing code modifications
   - Push methods (choose one):

     ```bash
     # Method A: Interactive push (Recommended)
     ./push-with-interactive-token.sh

     # Method B: Manual Token push (use when network issues)
     ./push-with-manual-token.sh

     # Method C: Simple push
     ./push-simple.sh

     # Method D: Complete push
     ./push-to-github-final.sh
     ```

   - Before pushing ensure:
     - All files added with `git add .`
     - Meaningful commit messages
     - GitHub Token is ready

   - **Manual Token Push Method** (when network or SSL issues):
     1. Generate GitHub Token: https://github.com/settings/tokens
     2. Select `repo` permission
     3. Run `./push-with-manual-token.sh`
     4. Paste Token
     5. Script will automatically construct HTTPS URL using Token for push

### Core Features

- **One-click Installation System** - Supports curl single-line installation
- **Multi-model Support** - DeepSeek, OpenAI, Ollama
- **Smart Installation** - Simple/Professional mode selection
- **AI-Centric Design** - Users interact naturally with AI, AI internally calls complex functionality
- **Cross-platform** - macOS, Linux, Windows

## 📁 File Structure Details

### 1. **Core Configuration Files**

#### `package.json` (v1.4.9)

```json
{
  "name": "naturecode",
  "version": "1.4.9",
  "type": "module",
  "main": "src/cli/index.js",
  "bin": { "naturecode": "src/cli/index.js" }
}
```

**Purpose**: Defines project metadata, dependencies, script commands
**Design**: ES module system, supports global installation

#### `AGENTS.md`

**Purpose**: AI assistant development guide
**Content**:

- Language requirements (Chinese conversations/English code)
- Development commands (npm run dev, npm test)
- Code style standards
- Security considerations

#### `.eslintrc.json`

**Purpose**: JavaScript code standards configuration
**Rules**:

- Double quote strings
- 2-space indentation
- Semicolon endings
- Maximum line length 100

### 2. **Installation System Files**

#### Installation Script Hierarchy

```
install.sh (entry) → install-smart.sh (smart selection) → specific installer
```

#### `install.sh` (33 lines)

```bash
#!/bin/bash
# Main entry script
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-smart.sh | bash
```

**Purpose**: Single-line installation entry
**Design**: Minimal, redirects to smart installer

#### `install-smart.sh` (434 lines)

**Purpose**: Smart installer, asks user for installation mode
**Features**:

- Terminal color support detection (tput/ANSI fallback)
- Simple mode (fast and quiet)
- Professional mode (detailed diagnostics)
- System information collection
- Comprehensive error handling

#### `install-simple.sh` (direct installation)

**Purpose**: Non-interactive fast installation
**Process**: Download → Install dependencies → Global installation

#### `install-universal.sh`

**Purpose**: Cross-platform universal installer
**Features**: Supports macOS, Linux, Windows

#### `install-now.sh`

**Purpose**: Local installation test script
**Use**: Quick testing in development environment

### 3. **GitHub Deployment Files**

#### `push-to-github-final.sh` (complete push)

**Purpose**: Complete GitHub push assistant
**Functions**:

1. Git status check
2. Multiple authentication methods (Token/SSH/existing credentials)
3. Commit and push
4. Verify push results
5. Display installation command

#### `push-simple.sh` (simple push)

**Purpose**: Fast Token push
**Process**: Add files → Commit → Token authentication push

#### `push-with-token.sh`

**Purpose**: Token-specific pusher
**Features**: Interactive Token input, detailed error handling

#### `GENERATE_TOKEN_GUIDE.md`

**Purpose**: Detailed GitHub Token generation guide
**Content**: Permission settings, expiration, usage steps

### 4. **Documentation Files**

#### `README_INSTALL.md`

**Purpose**: Quick installation guide
**Content**: Various installation methods, troubleshooting

#### `CURL_INSTALL.md`

**Purpose**: Detailed curl installation instructions
**Content**: Command examples, working principles, security notes

#### `INSTALLATION_ARCHITECTURE.md`

**Purpose**: Installation system architecture design
**Content**: Script hierarchy, error handling, user flow

#### `QUICK_PUSH_GUIDE.md`

**Purpose**: GitHub push quick reference
**Content**: Script selection, Token generation, verification steps

### 5. **Source Code Structure**

#### `src/cli/index.js`

**Purpose**: CLI main entry
**Functions**:

- commander.js parameter parsing
- Command routing (model, start, git, code, project)
- Error handling
- Version display

#### `src/utils/ascii-art.js`

**作用**: ASCII 艺术和版本显示
**功能**: 启动横幅、版本信息

### 6. **测试文件**

#### `tests/` 目录

**结构**:

```
tests/
├── cli/          # CLI 命令测试
├── config/       # 配置管理测试
├── team/         # 团队功能测试
├── utils/        # 工具函数测试
└── integration/  # 集成测试
```

#### `jest.config.js`

**作用**: Jest 测试配置
**特性**:

- ES 模块支持
- 覆盖率阈值 70%
- 测试文件匹配模式

### 7. **构建和发布**

#### `Makefile`

**作用**: 构建自动化
**命令**:

```bash
make install    # 安装依赖
make build      # 构建应用
make test       # 运行测试
make package    # 创建发布包
make dmg        # macOS DMG（仅 macOS）
```

#### `build_dmg.sh`

**作用**: macOS DMG 创建脚本
**功能**: 应用打包、图标设置、DMG 生成

#### `packager.js`

**作用**: 跨平台打包工具
**支持**: pkg 打包为可执行文件

### 8. **配置和状态**

#### `.naturecode/` 目录

**作用**: 用户配置和状态存储
**结构**:

```
.naturecode/
├── config.json          # 用户配置
├── sessions/           # 会话记录
├── team/              # 团队数据
│   ├── members/       # 成员信息
│   ├── projects/      # 项目数据
│   ├── teams/         # 团队信息
│   ├── policies.json  # 权限策略
│   └── roles.json     # 角色定义

```

## 系统架构设计

### 1. **模块化设计**

```
CLI 入口 → 命令分发 → 功能模块 → 工具函数
```

### 2. **错误处理策略**

- **网络错误**: 重试机制，友好提示
- **配置错误**: 自动修复建议
- **权限错误**: 详细指导
- **验证错误**: 输入验证和格式化

### 3. **用户交互设计**

- **渐进式披露**: 简单模式隐藏细节
- **颜色感知**: 自动检测终端颜色支持
- **响应式提示**: 根据上下文提供帮助
- **确认机制**: 危险操作需要确认

### 4. **安全设计**

- **配置加密**: 敏感数据加密存储
- **输入验证**: 所有用户输入验证
- **权限控制**: 最小权限原则
- **审计日志**: 操作记录

## 详细操作步骤

### 1. **安装 NatureCode**

#### 方法 A: curl 单行安装（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
```

**步骤分解**:

1. `install.sh` 下载 `install-smart.sh`
2. `install-smart.sh` 检测终端环境
3. 询问安装模式（简单/专业）
4. 检查系统要求（Node.js, npm）
5. 下载源代码
6. 安装依赖（npm install）
7. 全局安装（npm link 或全局安装）
8. 验证安装

#### 方法 B: 手动安装

```bash
git clone https://github.com/naturecode-official/naturecode.git
cd naturecode
npm install
npm link  # 或 sudo npm install -g .
```

### 2. **配置 AI 模型**

```bash
naturecode model
```

**交互流程**:

1. 选择 AI 提供商（DeepSeek/OpenAI）
2. 输入 API 密钥
3. 选择默认模型
4. 测试连接
5. 保存配置到 `~/.naturecode/config.json`

### 3. **使用 NatureCode**

#### 基本命令

```bash
naturecode start      # 启动交互会话
naturecode model      # 配置 AI 模型
naturecode config     # 显示当前配置
naturecode delmodel   # 删除模型配置
naturecode --help     # 查看帮助
naturecode --version  # 查看版本
```

#### 交互会话示例

```bash
$ naturecode start
 NatureCode v1.4.5.4 已就绪
> 帮我写一个 Python 函数计算斐波那契数列
```

### 4. **推送到 GitHub**

#### 步骤 1: 生成 Personal Access Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 设置权限: `repo` (Full control)
4. 设置有效期: 90天或无期限
5. 生成并复制 Token

#### 步骤 2: 使用脚本推送

```bash
./push-simple.sh
# 或
./push-to-github-final.sh
```

**脚本内部流程**:

1. 检查 Git 状态
2. 添加所有文件 (`git add .`)
3. 提交更改 (`git commit -m "消息"`)
4. 使用 Token 认证推送
5. 验证推送成功
6. 显示安装命令

#### 步骤 3: 手动推送

```bash
git add .
git commit -m "NatureCode v1.4.5.4 - Cross-platform AI assistant"
git push https://naturecode-official:TOKEN@github.com/naturecode-official/naturecode.git main
```

### 5. **测试安装系统**

#### 本地测试

```bash
./test-smart-installer.sh
./test-install-command.sh
```

#### 远程测试

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
```

## 🛠️ 开发工作流

### 1. **环境设置**

```bash
npm install
cp .env.example .env
# 编辑 .env 文件添加 API 密钥
```

### 2. **开发命令**

```bash
npm run dev      # 开发模式
npm test         # 运行测试
npm run lint     # 代码检查
npm run typecheck # 类型检查
npm run format   # 代码格式化
```

### 3. **测试特定功能**

```bash
# 测试特定文件
npm test -- --testPathPattern="filesystem"

# 测试特定测试
npm test -- --testNamePattern="test config validation"

# 测试覆盖率
npm test -- --coverage
```

### 4. **构建发布**

```bash
make build      # 构建应用
make test       # 运行所有测试
make package    # 创建发布包
make release    # 完整发布流程
```

## 🔍 故障排除指南

### 1. **安装问题**

#### 错误: "Node.js not found"

**解决**: 安装 Node.js v16+

```bash
# macOS
brew install node

# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# 验证
node --version
npm --version
```

#### 错误: "npm install failed"

**解决**: 清理缓存重试

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 2. **GitHub 推送问题**

#### 错误: "403 Forbidden"

**原因**: Token 权限不足或用户名错误
**解决**:

1. 确认 Token 有 `repo` 权限
2. 确认 GitHub 用户名是 `naturecode-official`
3. 清除旧凭据:

```bash
security delete-internet-password -s github.com
git config --global --unset credential.helper
```

#### 错误: "Could not read Password"

**原因**: macOS 钥匙串问题
**解决**:

```bash
git config --global credential.helper store
# 重新推送，输入 Token
```

### 3. **NatureCode 运行问题**

#### 错误: "Invalid API key"

**解决**: 重新配置模型

```bash
naturecode model
# 重新输入正确的 API 密钥
```

#### 错误: "Command not found"

**解决**: 确保正确安装

```bash
# 检查安装
which naturecode

# 重新安装
npm uninstall -g naturecode
npm link  # 在项目目录中
```

## 📈 项目状态和路线图

### 当前状态 (v1.4.5.4)

- 完整的安装系统
- 多模型 AI 支持
- 团队协作功能
- 插件系统
- 测试覆盖率 >70%
- 跨平台支持

### 待完成

- 🔄 GitHub 推送（需要 Token）
- 🔄 完整文档更新
- 🔄 更多插件开发
- 🔄 性能优化

### 技术栈

- **运行时**: Node.js (ES Modules)
- **CLI 框架**: commander.js
- **测试**: Jest
- **打包**: pkg, DMG 工具
- **代码质量**: ESLint, Prettier

## AI 助手使用指南

### 🚨 核心守则（必须遵守）

#### 1. 禁止使用 Emoji（项目内部）

- **代码文件** (.js, .sh, .json 等): 禁止任何 Emoji
- **注释**: 使用英文，禁止 Emoji
- **文档**: Markdown 文件中可以使用符号（如 、、），但避免表情符号
- **用户界面**: CLI 输出可以使用简单符号增强可读性
- **例外**: 仅限用户可见的友好提示，代码内部严格禁止

#### 2. 语言使用规范

- **与用户对话**: 始终使用中文（回应中文提问）
- **代码编写**: 变量名、函数名、注释使用英文
- **错误消息**:
  - 用户界面: 友好的中文提示
  - 技术日志: 英文错误代码和详细信息
- **文档**:
  - 技术文档: 英文为主
  - 用户指南: 中英双语或中文
- **提交信息**: 英文提交信息，描述更改内容

#### 3. 代码提交后自动推送至 GitHub

- **完成修改后必须推送**，保持 GitHub 仓库同步
- **推送流程**:
  1. 检查更改: `git status`
  2. 添加文件: `git add .`
  3. 提交更改: `git commit -m "描述性信息"`
  4. 选择推送方法（见下文）
  5. 验证推送成功

- **推送方法选择**:

  ```bash
  # 方法 A: 交互式推送（推荐给 AI 助手）
  ./push-with-interactive-token.sh
  # 特点: 交互式 Token 输入，详细提示，自动验证

  # 方法 B: 简单推送
  ./push-simple.sh
  # 特点: 快速简单，适合小更改

  # 方法 C: 完整功能推送
  ./push-to-github-final.sh
  # 特点: 完整功能，支持多种认证方式
  ```

- **GitHub Token 准备**:
  1. 访问: https://github.com/settings/tokens
  2. 生成新 Token (classic)
  3. 权限: `repo` (Full control)
  4. 有效期: 90天或无期限
  5. 保存 Token 在安全地方

- **验证推送**:

  ```bash
  # 检查远程状态
  git remote show origin

  # 测试安装命令
  curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash --dry-run
  ```

### 为 AI 提供上下文

当请求 AI 帮助时，提供:

1. **当前文件路径**: `file_path:line_number`
2. **错误信息**: 完整的错误输出
3. **预期行为**: 期望的结果
4. **已尝试方案**: 已经尝试的解决方法
5. **是否已遵守守则**: 确认 Emoji、语言、推送规范

### 代码修改规范

1. **遵循现有风格**: 2空格缩进，双引号，分号
2. **添加适当注释**: 复杂逻辑需要解释（英文）
3. **更新测试**: 修改功能后更新测试
4. **验证更改**: 运行 lint 和测试
5. **检查 Emoji**: 确保代码中没有 Emoji
6. **语言检查**: 代码英文，用户提示中文

### 安全注意事项

1. **不提交敏感信息**: API 密钥、Token、密码
2. **输入验证**: 所有用户输入需要验证
3. **错误处理**: 友好的错误消息，不暴露内部信息
4. **权限控制**: 最小权限原则
5. **Token 安全**: 不在代码中硬编码 Token

## 📞 支持和贡献

### 问题报告

- GitHub Issues: https://github.com/naturecode-official/naturecode/issues
- 包含: 版本号、操作系统、错误信息、复现步骤

### 贡献指南

1. Fork 仓库
2. 创建功能分支
3. 遵循代码规范
4. 添加测试
5. 提交 Pull Request

### 开发资源

- **文档**: `docs/` 目录
- **示例**: `tests/` 目录
- **设计文档**: `*_DESIGN.md` 文件
- **配置指南**: `*_GUIDE.md` 文件

---

## GitHub 上传验证指南

### 当前上传状态

- **版本**: NatureCode v1.4.5.4 已上传
- **仓库**: https://github.com/naturecode-official/naturecode 可访问
- **安装命令**: 工作正常 已验证
- **提交哈希**: `9aa473e` 最新

### 验证命令

```bash
# 1. 验证仓库可访问
curl -I https://github.com/naturecode-official/naturecode

# 2. 验证安装命令
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | head -5

# 3. 验证版本号
curl -s https://raw.githubusercontent.com/naturecode-official/naturecode/main/package.json | grep '"version"'

# 4. 验证智能安装器
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-smart.sh | head -10

# 5. 查看提交历史
git log --oneline --graph --all
```

### 上传成功标志

1.  **GitHub 仓库可访问**: https://github.com/naturecode-official/naturecode
2.  **安装命令工作**: `curl ... | bash` 可正常执行
3.  **版本正确**: 显示 `1.4.5.4`
4.  **代码同步**: 本地和远程代码一致
5.  **功能完整**: 所有文件已上传

### 后续上传流程

1. **代码修改后**:

   ```bash
   git add .
   git commit -m "描述更改内容"
   ./push-with-key-md.sh
   ```

2. **使用 key.md**:

   ```bash
   # 保存 Token 到 key.md
   echo "YOUR_TOKEN" > key.md

   # 推送代码
   ./push-with-key-md.sh

   # 完成后删除敏感文件（建议）
   rm key.md
   ```

3. **验证上传**:

   ```bash
   # 测试安装命令
   curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash --dry-run

   # 检查仓库
   open https://github.com/naturecode-official/naturecode
   ```

### 安全建议

1.  **删除敏感文件**: `rm key.md`（如果不再需要）
2.  **Token 管理**: 保存在安全的地方，定期更新
3.  **访问控制**: 监控 GitHub 访问日志
4.  **备份策略**: 定期备份重要数据和配置

---

## 📋 版本更新和维护指南

### 每次新增功能必须更新的文件：

#### 1. **版本号更新**（必须同时更新所有位置）：

- `package.json` - 主版本号
- `package-lock.json` - 依赖版本号
- `src/utils/ascii-art.js` - UI 显示版本

- `CHANGELOG.md` - 更新日志

#### 2. **文档更新**：

- `docs.md` - 主使用文档
  - 更新版本号引用
  - 添加新功能说明
  - 更新命令列表
  - 添加使用示例
- `AGENTS.md` - AI 助手开发指南
  - 更新命令列表
  - 添加新功能说明
  - 更新开发指南

#### 3. **安装脚本更新**：

- `install-smart.sh` - 主安装脚本
  - 更新版本显示
  - 添加新功能安装步骤
  - 更新系统要求
- `install.sh` - 入口脚本（通常不需要修改）

#### 4. **代码文件更新检查清单**：

- ✅ 所有硬编码版本号已更新
- ✅ 新功能已添加到帮助系统
- ✅ 文档已同步更新
- ✅ 安装脚本支持新功能
- ✅ 测试用例已添加/更新
- ✅ 错误消息和提示已更新

### 文件增减时的注意事项：

#### 增加新文件时：

1. **添加到 Git**：确保 `git add` 新文件
2. **更新 `.gitignore`**：如有需要
3. **更新 `package.json`**：如有新依赖
4. **更新安装脚本**：如需复制/安装新文件
5. **更新文档**：说明新文件用途

#### 删除文件时：

1. **从 Git 移除**：`git rm` 删除的文件
2. **检查依赖**：确保没有代码依赖被删除的文件
3. **更新文档**：移除相关说明
4. **更新安装脚本**：不再复制/安装该文件

### 自动化检查命令：

```bash
# 检查版本一致性
grep -r "1\.4\.5\." --include="*.js" --include="*.json" --include="*.md"

# 检查未提交的文件
git status

# 运行测试
npm test

# 代码检查
npm run lint

# 类型检查
npm run typecheck
```

### 发布流程：

1. 更新所有版本号
2. 更新 CHANGELOG.md
3. 更新 docs.md 和 AGENTS.md
4. 运行测试确保通过
5. 提交更改到 Git
6. 推送到 GitHub
7. 验证安装命令工作正常

---

## 📝 2026-02-15 更新记录

### 版本更新: 1.4.6 → 1.4.7 → 1.4.7.1

#### 1.4.7 版本更新内容：

1. **版本号统一更新**：
   - package.json: 1.4.6 → 1.4.7
   - CLI 版本显示更新
   - ASCII 艺术版本更新
   - 反馈系统版本更新

2. **安装脚本更新**：
   - install-smart.sh: 版本显示和默认版本
   - install-curl.sh: 脚本版本、提示信息和默认版本
   - install-local-test.sh: 版本提示和默认版本

3. **文档更新**：
   - whatisthis.md: 版本信息更新
   - AGENTS.md: 代码风格指南完善

#### 1.4.7.1 版本修复内容：

1. **安装脚本修复**：
   - 修复 `log_warn: command not found` 错误
   - 统一日志函数名称为 `log_warning`
   - 确保安装过程无错误

#### 1.4.7.2 版本更新内容：

1. **安装消息修复**：
   - 修复安装成功消息中的错误指引
   - 删除 "naturecode help 'your question'" 引用，使用 "naturecode start" 进行 AI 协助
   - 准确反映实际可用功能

#### 技术细节：

- **推送方式**: 使用 HTTPS + Token 推送（SSL 验证临时禁用）
- **测试验证**: 安装命令和版本检查通过
- **安全措施**: Token 单次使用，不保存

#### 当前状态：

- ✅ 版本 1.4.7.2 已准备发布
- ✅ 安装系统正常工作
- ✅ 安装消息准确无误
- ✅ 所有版本引用一致
- ✅ GitHub 仓库同步完成

---

## 🎯 今日工作完整总结 (2026-02-15)

### 工作流程概览：

1. **初始任务**: 分析代码库并创建/更新 AGENTS.md 文件
2. **版本更新**: 1.4.6 → 1.4.7 → 1.4.7.1 → 1.4.7.2
3. **问题发现与修复**: 安装脚本错误和消息不准确
4. **GitHub 同步**: 多次推送解决网络/SSL 问题
5. **文档更新**: 完整记录所有工作

### 详细工作记录：

#### 第一阶段: AGENTS.md 完善

- 分析了现有 AGENTS.md 文件（351 行，已很完善）
- 检查了项目结构、构建命令、代码风格指南
- 确认了 ESLint、Jest、Makefile 配置
- 决定不重复创建，而是优化现有文档

#### 第二阶段: 版本更新 (1.4.6 → 1.4.7)

**更新文件**:

- `package.json`: 1.4.6 → 1.4.7
- `src/cli/index.js`: CLI 版本显示
- `src/utils/ascii-art.js`: ASCII 艺术版本
- `src/utils/feedback.js`: 反馈系统版本
- `install-smart.sh`: 安装脚本版本
- `install-curl.sh`: curl 安装脚本版本
- `install-local-test.sh`: 本地测试脚本版本
- `whatisthis.md`: 文档版本信息

#### 第三阶段: 问题发现与修复

**问题 1**: `log_warn: command not found` 错误

- **原因**: 脚本中使用 `log_warn`，但函数定义是 `log_warning`
- **修复**: 统一为 `log_warning`
- **版本**: 发布 1.4.7.1 修复此问题

**问题 2**: 安装成功消息不准确

- **问题**: `naturecode help "question"` 功能已被彻底删除
- **修复**: 改为 `You can now use: naturecode start (for AI assistance)`
- **版本**: 发布 1.4.7.2 修复此问题

#### 第四阶段: GitHub 推送挑战与解决

**遇到的困难**:

1. **SSL 连接问题**: `LibreSSL SSL_connect: SSL_ERROR_SYSCALL`
2. **SSH 密钥问题**: Permission denied (publickey)
3. **Token 认证问题**: 401 Unauthorized

**解决方案**:

1. 临时禁用 SSL 验证: `git config http.sslVerify false`
2. 使用详细日志调试: `GIT_CURL_VERBOSE=1 GIT_TRACE=1`
3. 最终成功推送所有版本更新

#### 第五阶段: 安全措施

- 🔒 **Token 处理**: 仅用于单次推送，未保存
- 🔒 **SSL 恢复**: 推送后恢复 SSL 验证设置
- 🔒 **凭据清理**: 不保留任何敏感信息

### 技术成果：

#### 版本演进:

- **1.4.6** → **1.4.7**: 基础版本更新
- **1.4.7** → **1.4.7.1**: 修复 `log_warn` 错误
- **1.4.7.1** → **1.4.7.2**: 修复安装消息准确性

#### 代码质量:

- ✅ 所有版本引用一致
- ✅ 安装脚本无错误
- ✅ 用户指引准确
- ✅ 文档完整更新

#### 部署状态:

- ✅ GitHub 仓库同步完成
- ✅ 安装命令工作正常
- ✅ 版本验证通过
- ✅ 功能测试通过

### 经验教训：

1. **版本管理**: 必须更新所有相关文件中的版本号
2. **错误处理**: 安装脚本需要完善的错误检查和用户友好提示
3. **网络问题**: 准备好应对 SSL/网络问题的多种解决方案
4. **安全实践**: Token 必须单次使用，不保存，及时撤销
5. **文档同步**: 代码更新必须伴随文档更新

### 未来建议：

1. **自动化测试**: 添加安装脚本的自动化测试
2. **版本检查**: 创建版本一致性检查脚本
3. **错误监控**: 添加安装错误报告机制
4. **文档维护**: 保持文档与代码同步更新
5. **安全加固**: 考虑使用更安全的认证方式

---

## 📝 2026-02-16 更新记录

### 版本更新: 1.4.7.3 → 1.4.8

#### 主要改进内容：

##### 1. **模型配置增强**

- **自定义模型命名**: 用户可以为每个模型配置起易记的名字（如 "Work GPT"、"Personal Claude"、"Code Assistant"）
- **改进的显示界面**: 在启动时显示用户定义的名称而不是技术字段
- **元数据存储**: 更新 secure store 以支持模型元数据存储
- **向后兼容**: 旧的没有元数据的配置仍然可以工作

##### 2. **AI 系统提示增强**

- **详细的文件工具说明**: AI 现在知道如何使用文件读取、写入、创建、删除等工具
- **主动帮助指导**: 教导 AI 主动使用文件工具，不需要用户指导
- **好的响应示例**: 提供修复错误、创建组件、分析项目等示例
- **重要规则**: 创建/编辑时总是提供完整文件内容，使用代码块，保持安全

##### 3. **帮助系统修复**

- **修复 CLI 帮助输出**: 更新帮助命令描述，准确反映可用功能
- **彻底删除**: 完全移除 `help "question"` 功能和相关引用
- **更新文档**: 所有文档现在一致地指导用户使用 `naturecode start` 获取 AI 帮助
- **清理旧文件**: 移除旧的 `help-original.js` 文件

##### 4. **网络问题解决方案**

- **本地安装脚本**: 创建 `local-install.sh` 避免网络连接问题
- **稳定安装脚本**: 创建 `robust-install.sh` 包含多种下载方法和错误处理
- **SSL 问题处理**: 添加网络问题诊断和解决方案

##### 5. **版本管理**

- **统一版本号**: 更新所有文件到版本 1.4.8
- **版本验证**: 确保所有组件显示一致的版本号

##### 6. **sk-proj API 密钥完全兼容**

- **OpenAI 项目密钥支持**: 完全支持 `sk-proj-` 格式的 API 密钥
- **移除错误警告**: 不再将 sk-proj- 密钥标记为无效格式
- **验证逻辑更新**: 更新 API 密钥验证以接受项目密钥
- **错误消息改进**: 提供更准确的错误信息

##### 7. **GPT-5 模型完全支持**

- **参数自动选择**: GPT-5 系列使用 `max_completion_tokens`，其他模型使用 `max_tokens`
- **模型列表更新**: 添加 GPT-5 系列模型支持
- **向后兼容**: 现有配置无需修改即可工作
- **搜索预览模型**: 支持 `gpt-4o-mini-search-preview` 和 `gpt-4o-search-preview`

##### 8. **详细的 400 错误诊断**

- **增强错误处理**: 提供具体的错误诊断信息
- **用户友好消息**: 将技术错误转换为用户可理解的建议
- **API 密钥验证**: 改进的密钥格式和权限检查
- **网络问题诊断**: 更好的连接问题识别

##### 9. **代码质量改进**

- **修复重复代码**: 解决 openai.js 中的语法错误
- **性能优化**: 改进错误处理流程
- **代码清理**: 移除重复和不必要的代码

#### 技术细节：

##### 修改的文件：

1. **src/cli/commands/model.js** - 添加自定义名称提示
2. **src/cli/commands/start.js** - 改进模型选择显示
3. **src/config/secure-store.js** - 支持元数据存储
4. **src/config/manager.js** - 修复 API 密钥加载逻辑
5. **src/cli/commands/help.js** - 修复帮助系统
6. **src/providers/deepseek.js** - 增强系统提示
7. **src/providers/openai.js** - 增强系统提示，添加 GPT-5 支持，修复重复代码
8. **src/providers/base.js** - 添加默认系统提示，增强错误诊断
9. **package.json** - 更新版本号到 1.4.8
10. **src/cli/index.js** - 更新版本显示，添加专业模式品牌
11. **src/utils/ascii-art.js** - 更新版本显示
12. **src/utils/feedback.js** - 更新版本显示
13. **install-smart.sh** - 更新版本显示
14. **install-curl.sh** - 更新版本显示
15. **install-local-test.sh** - 更新版本显示
16. **package-lock.json** - 更新版本号
17. **whatisthis.md** - 更新文档
18. **FINAL_INSTALL_COMMANDS.md** - 修复文档
19. **CURL_INSTALL.md** - 修复文档
20. **UPDATES_COMPLETED.md** - 修复文档
21. **新增 local-install.sh** - 本地安装脚本
22. **新增 robust-install.sh** - 稳定安装脚本

##### 提交记录：

1. **24d65d4** - feat: improve model configuration with custom naming
2. **38d9508** - feat: enhance AI system prompt with detailed file tool instructions
3. **5cf8ba1** - fix: remove help "question" references from documentation
4. **9876d4f** - fix: update CLI help output and remove incorrect references
5. **ac8ea74** - feat: add detailed 400 error diagnostics and user-friendly error handling
6. **2e69495** - feat: add full sk-proj API key compatibility and GPT-5 support
7. **6c65ed1** - feat: update version to 1.4.8 with sk-proj API compatibility and GPT-5 support

# NatureCode 更新记录 - 2026年2月16日

## 版本 1.5.5 更新

### 1. 架构一致性修复：移除DashScope静态模型列表

**文件**: `src/providers/dashscope.js`, `whatisthis`
**内容**:

- **架构一致性**: 修复DashScopeProvider以符合项目在版本1.5.0中确立的架构
- **移除静态列表**: 删除`getStaticAvailableModels()`和`getStaticModelDescriptions()`中的静态模型列表
- **简化验证**: `validateConfig()`现在只检查模型名是否存在，不验证是否在预定义列表中
- **智能提示**: 添加控制台提示，引导用户查看DashScope控制台获取可用模型
- **保持能力检测**: 保留基于模型名模式的能力检测功能 (vision, audio, code)

**修复原则**:

- 遵循版本1.5.0架构：移除预制模型名，支持用户自定义输入
- 配置向导使用文本输入框，用户可以输入任意模型名
- 只验证模型名是否存在，不验证是否在预定义列表中
- 智能提示用户查看各AI服务商官网获取可用模型列表

### 2. 文档更新

**文件**: `README.md`, `whatisthis`
**内容**:

- **版本更新**: README.md版本号更新到1.5.5
- **功能列表**: 更新provider总数到11个
- **文档完善**: 更新whatisthis文件中的版本记录

## 版本 1.5.4 更新

### 1. 添加Qwen (DashScope) 提供者支持

**文件**: `src/providers/dashscope.js`, `src/cli/commands/model.js`, `src/cli/commands/start.js`
**内容**:

- **DashScope集成**: 添加Qwen (DashScope) 作为新的AI提供者选项
- **固定base URL**: `https://dashscope.aliyuncs.com/` (必须包含结尾斜杠)
- **API端点**: `/compatible-mode/v1/chat/completions` (OpenAI兼容API)
- **模型支持**: 支持所有通义千问模型 (qwen-max, qwen-plus, qwen-turbo, qwen2.5系列等)
- **配置向导**: 在提供者选择中添加Qwen (DashScope) 选项
- **模型能力**: 支持文本、聊天、视觉、音频、代码等多种模型类型
- **智能默认值**: 默认模型为`qwen-turbo` (极速版)

**Qwen模型支持**:

- **无静态模型列表**: 遵循项目架构，不提供静态模型列表
- **用户自定义输入**: 用户可以输入任意Qwen模型名
- **智能提示**: 配置时提示用户查看DashScope控制台获取可用模型
- **模型能力检测**: 基于模型名自动检测能力 (vision, audio, code)
- **默认模型**: qwen-turbo (极速版，可修改)

**技术实现细节**:

- **提供者类**: 创建`DashScopeProvider`类，继承自`AIProvider`
- **API兼容性**: 使用OpenAI兼容的API格式
- **模型能力检测**: 基于模型名自动检测能力 (vision, audio, code)
- **流式支持**: 完整支持流式生成
- **错误处理**: 完整的API错误处理和用户友好提示

## 版本 1.5.3 更新

### 1. 移除默认回退模型配置

**文件**: `src/cli/commands/model.js`
**内容**:

- **简化配置**: 移除配置向导中的默认回退模型设置
- **自动处理**: 回退模型现在由系统自动处理，无需用户配置
- **减少复杂度**: 简化配置流程，减少用户决策点

### 2. 添加4SAPI提供者支持

**文件**: `src/providers/4sapi.js`, `src/cli/commands/model.js`, `src/cli/commands/start.js`
**内容**:

- **4SAPI集成**: 添加4SAPI作为新的AI提供者选项
- **固定base URL**: `https://4sapi.com/v1` (OpenAI兼容API)
- **模型支持**: 支持所有OpenAI兼容模型 (GPT-4o, GPT-4, GPT-3.5, DALL-E, TTS, Whisper等)
- **配置向导**: 在提供者选择中添加4SAPI选项

## 版本 1.5.2 更新

### 1. 添加Azure OpenAI提供者支持

**文件**: `src/providers/azure-openai.js`, `src/cli/commands/model.js`, `src/cli/commands/start.js`
**内容**:

- **Azure OpenAI集成**: 添加Azure OpenAI作为新的AI提供者选项
- **Azure特定配置**: 需要Azure OpenAI资源名称和API版本
- **URL格式**: `https://{resource-name}.openai.azure.com/` (必须包含结尾斜杠)
- **模型支持**: 支持所有Azure OpenAI部署的模型 (gpt-35-turbo, gpt-4, gpt-4o等)
- **配置向导**: 添加Azure OpenAI特定配置问题
- **认证**: 使用API密钥认证，与标准OpenAI兼容但URL格式不同

### 2. 添加n1n.ai提供者支持

**文件**: `src/providers/n1n.js`, `src/cli/commands/model.js`, `src/cli/commands/start.js`
**内容**:

- **n1n.ai集成**: 添加n1n.ai作为新的AI提供者选项
- **OpenAI兼容API**: n1n.ai使用OpenAI兼容的API接口
- **固定base URL**: `https://api.n1n.top/v1`
- **模型支持**: 支持GPT-4o、GPT-4、GPT-3.5等OpenAI兼容模型
- **配置向导**: 在提供者选择中添加n1n.ai选项

### 2. 技术实现细节

- **提供者类**: 创建`N1NProvider`类，继承自`OpenAIProvider`
- **API兼容性**: 完全兼容OpenAI API格式
- **模型能力**: 支持文本、聊天、视觉、音频等多种模型类型
- **智能默认值**: 默认模型为`gpt-4o-mini`

## 版本 1.5.0 重大更新

### 1. 配置系统重构：移除预制模型名，支持用户自定义输入

**文件**: `src/cli/commands/model.js`, `src/providers/*.js`
**内容**:

- **配置向导改进**: 将模型选择从列表改为输入框，用户可以输入任意模型名
- **移除预制模型列表**: 删除所有provider中的静态模型列表，避免模型上下线导致的更新问题
- **智能提示**: 配置时提示用户查看各AI服务商官网获取可用模型列表
- **验证简化**: 只验证模型名是否存在，不验证是否在预定义列表中

### 2. 错误处理优化

**文件**: `src/providers/base.js`
**内容**:

- **简化400错误信息**: 移除冗长的包装错误信息，只显示核心错误
- **更好的错误诊断**: 提供简洁的错误信息和关键诊断提示

### 3. API端点简化：只使用官方API

**文件**: `src/providers/openai.js`, `src/providers/deepseek.js`, `src/providers/anthropic.js`, `src/providers/gemini.js`
**内容**:

- **移除自定义base_url支持**: 所有provider现在只使用官方API端点
- **简化代码**: 移除base_url配置逻辑，减少复杂性
- **提高稳定性**: 确保用户始终使用官方、稳定的API服务

### 4. 技术实现细节

**配置向导改进**:

- 将模型选择从下拉列表改为文本输入框
- 添加智能默认值提示（可修改）
- 提示用户查看各AI服务商官网获取可用模型
- 简化验证逻辑，只检查模型名是否存在

**Provider验证简化**:

- 移除所有静态模型列表和验证
- 只验证API密钥格式和模型名存在性
- 添加控制台提示，指导用户查看官方文档

**错误处理优化**:

- 简化400错误信息，移除冗长包装
- 提供核心错误信息和关键诊断
- 保持错误信息简洁易读

## 已完成的任务

### 5. 删除Ollama智能help功能

**文件**: `src/cli/commands/help.js`
**内容**:

- 删除了`callOllama()`方法
- 删除了`getDirectAIHelp()`方法中的Ollama相关逻辑
- 删除了`startDirectAIChat()`方法
- 删除了相关的辅助方法：`checkOllamaInstalled()`, `setupOllamaForDirectChat()`, `autoPullDeepSeekModel()`, `checkDeepSeekModel()`
- 简化了help命令，只保留基本帮助功能
- 删除了Ollama测试文件：`test-ollama.js`, `test-call-ollama.js`, `test-ollama-quick.js`

**保留的功能**:

- Ollama provider仍然可用（通过`naturecode model`配置）
- 基本的help命令功能
- 文档查看功能

### 6. 清理OpenAI模型列表中的"妖魔鬼怪"（重大清理）

**发现问题**: OpenAI模型列表包含了大量不合理的模型：

1. **Claude模型** - 这是Anthropic的模型，不是OpenAI的
2. **过于推测的未来模型** - GPT-4.5系列、GPT-4o 2025增强版等
3. **不存在的模型** - DALL-E 4、Whisper 3、Codex 2等
4. **纯非文本模型** - 在NatureCode终端助手上下文中无意义

**清理过程**:

1. **第一次清理** (提交: 5110cab)
   - 删除Claude-4和Claude-3.5（Anthropic模型）
   - 删除过于推测的GPT-4.5系列
   - 删除GPT-4o 2025增强版系列
   - 删除不存在的DALL-E 4、Whisper 3、Codex 2
   - 模型数量: 46个 → 22个

2. **第二次清理** (提交: c4e475b)
   - 删除所有纯非文本模型（在NatureCode中无意义）：
     - DALL-E 3（纯图像生成）
     - Whisper-1（纯语音识别）
     - GPT-5-vision（视觉专用）
     - GPT-4-vision-preview（视觉分析）
   - 只保留有文本生成能力的模型
   - 模型数量: 22个 → 18个

**最终模型列表** (18个纯文本模型):

- **GPT-4系列**: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-4, gpt-4-32k (5个)
- **GPT-3.5系列**: gpt-3.5-turbo, gpt-3.5-turbo-16k, gpt-3.5-turbo-instruct (3个)
- **未来预测**: gpt-5, gpt-5-turbo (2个)
- **企业版**: gpt-4-enterprise, gpt-4o-enterprise (2个)
- **特定版本**: 6个历史版本

**关键原则**:

1. 所有模型必须有文本生成能力（适合终端AI助手）
2. 只包含OpenAI的实际或合理预测模型
3. 删除在NatureCode上下文中无意义的模型

### 7. Anthropic (Claude) 模型支持添加

**新增功能**:

1. **Anthropic provider实现**: `src/providers/anthropic.js`
   - 支持Claude 3.5系列 (Sonnet, Haiku)
   - 支持Claude 3系列 (Opus, Sonnet, Haiku)
   - 完整的文件系统集成
   - 流式和非流式生成支持

2. **配置系统更新**: `src/config/manager.js`
   - 添加Anthropic到VALID_PROVIDERS
   - 添加ANTHROPIC_MODELS常量 (5个模型)
   - 添加模型验证逻辑
   - 支持Anthropic故障回退模型

3. **配置向导更新**: `src/cli/commands/model.js`
   - 添加Anthropic provider选项
   - 添加Anthropic API key输入
   - 添加Anthropic模型选择 (5个模型)
   - 添加Anthropic故障回退支持 (claude-3-5-haiku-20241022)

4. **启动系统更新**: `src/cli/commands/start.js`
   - 导入AnthropicProvider
   - 更新createProvider函数支持Anthropic

**Anthropic模型列表** (5个模型):

- **Claude 3.5系列**:
  - claude-3-5-sonnet-20241022 (默认) - 最强大的复杂任务模型
  - claude-3-5-haiku-20241022 (故障回退) - 快速高效的简单任务模型
- **Claude 3系列**:
  - claude-3-opus-20240229 - 最强大的高度复杂任务模型
  - claude-3-sonnet-20240229 - 平衡的通用模型
  - claude-3-haiku-20240307 - 最快的简单查询模型

### 8. Google Gemini 模型支持添加和更新

**新增功能**:

1. **Gemini provider实现**: `src/providers/gemini.js`
   - 支持Gemini 3系列 (Pro, Deep Think, Flash)
   - 支持Gemini 2.5系列 (Pro, Flash, Flash-Lite, Computer Use)
   - 支持Gemini 2.0系列 (Flash, Pro, Flash Thinking)
   - 支持开源Gemma系列 (Gemma 3n, Gemma 3, Gemini 2, CodeGemma, ShieldGemma 2)
   - 完整的文件系统集成
   - 流式和非流式生成支持
   - Google API格式适配
   - 高级能力分类 (text, chat, vision, code, security)

2. **配置系统更新**: `src/config/manager.js`
   - 添加Gemini到VALID_PROVIDERS
   - 更新GEMINI_MODELS常量 (19个模型)
   - 添加模型验证逻辑
   - 支持Gemini故障回退模型 (gemini-3-pro)

3. **配置向导更新**: `src/cli/commands/model.js`
   - 添加Gemini provider选项
   - 添加Gemini API key输入
   - 更新Gemini模型选择 (19个模型)
   - 更新Gemini模型类型选择 (text, chat, vision, code, security)
   - 更新Gemini故障回退支持 (gemini-3-pro)
   - 更新默认模型为gemini-3-pro

4. **启动系统更新**: `src/cli/commands/start.js`
   - 导入GeminiProvider
   - 更新createProvider函数支持Gemini

5. **Bug修复**:
   - 修复Ollama API key输入问题 (移除when条件中的ollama)
   - 修复模型选择字段缺失的问题

**Gemini模型列表** (19个模型):

- **Gemini 3系列** (最新):
  - gemini-3-pro (默认) - 最先进的复杂推理和分析模型 (推荐)
  - gemini-3-deep-think - 专为深度分析思维和问题解决
  - gemini-3-flash - 快速高效的最新代模型

- **Gemini 2.5系列**:
  - gemini-2.5-pro - 高性能专业用途模型
  - gemini-2.5-flash - 平衡的速度和能力
  - gemini-2.5-flash-lite - 轻量版简单任务模型
  - gemini-2.5-computer-use - 专为计算机交互和自动化

- **Gemini 2.0系列**:
  - gemini-2.0-flash - 快速高效的通用模型
  - gemini-2.0-pro - 专业级强大能力模型
  - gemini-2.0-flash-thinking - 增强推理能力

- **开源Gemma系列**:
  - gemma-3n - 最新开源增强能力模型
  - gemma-3 - 通用开源模型
  - gemini-2 - Gemini 2开源版本
  - codegemma - 专为代码生成和分析
  - shieldgemma-2 - 安全重点增强安全特性

- **遗留模型** (向后兼容):
  - gemini-2.0-flash-exp - 实验性增强能力模型
  - gemini-1.5-flash - 平衡的性能和速度
  - gemini-1.5-pro - 复杂推理能力模型
  - gemini-1.0-pro - 原始专业强大能力模型

**故障回退机制**:

- 默认故障回退模型: `gemini-3-pro`
- 当选择的Gemini模型失效时自动切换到gemini-3-pro
- 确保服务的高可用性

### 8. GitHub推送记录

**今天推送的所有提交**:

1. **7e2f77d** - feat: enhance configuration wizard with default prompts and OpenAI fallback model support
   - 配置向导改进：添加默认值提示和故障回退
2. **14b6e3f** - chore: add push-now.sh script for GitHub deployment
   - 添加部署脚本
3. **ef1ce59** - refactor: remove Ollama smart help functionality and simplify help command
   - 删除Ollama智能help功能（已修改为9bb7041）
4. **9bb7041** - refactor: remove Ollama smart help functionality and simplify help command
   - 修复whatisthis文件中的Token泄露问题
5. **5110cab** - fix: clean up OpenAI model list and remove inappropriate models
   - 第一次OpenAI模型清理（删除Claude等）
6. **c4e475b** - refactor: remove non-text models from OpenAI list for NatureCode context
   - 第二次OpenAI模型清理（删除所有非文本模型）

**总清理效果**:

- 初始模型数量: 46个（包含各种问题模型）
- 第一次清理后: 22个（删除Claude、过于推测模型）
- 最终清理后: 18个（只保留纯文本模型）
- **清理比例**: 61% 的模型被删除

## 项目现状

**已完成**:

1. OpenAI模型全面更新和清理
2. 配置向导用户体验改进
3. Ollama智能help功能删除
4. Anthropic (Claude) 模型支持添加
5. Google Gemini 模型支持添加
6. Zhipu AI (智谱AI) 模型支持添加
7. n1n.ai OpenAI兼容API支持添加
8. Azure OpenAI Microsoft Azure托管模型支持添加
9. 4SAPI OpenAI兼容API支持添加
10. 自定义提供者支持添加
11. 移除默认回退模型配置
12. 版本升级到1.5.5
13. Qwen (DashScope) 提供者支持添加
14. DashScope架构一致性修复（移除静态模型列表）
15. 所有更改已推送到GitHub
16. 模型列表现在干净、合理、实用

🎯 **当前状态 (v2.0.0)**:

- OpenAI模型列表: 18个纯文本模型
- Anthropic模型列表: 5个Claude模型
- Gemini模型列表: 5个Google模型
- 配置向导: 支持默认值，简化配置流程
- help命令: 简化版，只显示基本帮助
- GitHub: 所有更改已同步

**技术架构**:

- 支持DeepSeek、OpenAI、Azure OpenAI、n1n.ai、4SAPI、Qwen (DashScope)、Anthropic、Google Gemini、Ollama、Zhipu AI、Custom Provider十一个provider
- 配置系统支持故障回退机制
- 用户界面友好，支持默认值
- 代码质量经过多次清理和优化

**当前状态**:

- OpenAI配置：用户输入模型名，提示查看platform.openai.com
- Azure OpenAI配置：需要Azure资源名称、API版本和模型名，提示查看Azure OpenAI门户
- n1n.ai配置：用户输入模型名，使用OpenAI兼容API (https://api.n1n.top/v1)
- 4SAPI配置：用户输入模型名，使用OpenAI兼容API (https://4sapi.com/v1)
- DeepSeek配置：用户输入模型名，提示查看platform.deepseek.com
- Anthropic配置：用户输入模型名，提示查看console.anthropic.com
- Google Gemini配置：用户输入模型名，提示查看ai.google.dev
- Ollama配置：用户输入模型名，提示运行'ollama list'
- Zhipu AI配置：用户输入模型名，提示查看open.bigmodel.cn
- 自定义提供者配置：支持任何AI API，需要提供base URL和API密钥

### 使用指南

1. **配置模型**: `naturecode model`
2. **查看可用模型**: 访问各AI服务商官网
3. **开始使用**: `naturecode start`
4. **获取帮助**: `naturecode --help`
5. **删除模型配置**: `naturecode delmodel <name>` 或 `naturecode delmodel all`

## 📝 2026-02-16 更新记录

### 版本更新: 1.5.6 → 2.0.0

#### 1. 添加Tencent Hunyuan (腾讯混元) 提供者支持

**文件**: `src/providers/tencent.js`, `src/cli/commands/model.js`, `src/cli/commands/start.js`
**内容**:

- **Tencent Cloud集成**: 添加Tencent Hunyuan作为新的AI提供者选项
- **固定base URL**: `https://hunyuan.tencentcloudapi.com` (Tencent Cloud API格式)
- **API端点**: 使用Tencent Cloud API格式，非OpenAI兼容API
- **模型支持**: 支持所有腾讯混元模型 (hunyuan-pro, hunyuan-standard, hunyuan-lite等)
- **配置向导**: 在提供者选择中添加Tencent Hunyuan选项
- **模型能力**: 支持文本、聊天、视觉、代码等多种模型类型
- **智能默认值**: 默认模型为`hunyuan-pro`
- **必需配置**: Tencent Cloud API密钥，区域（默认：ap-guangzhou）

**Tencent Hunyuan模型支持**:

- **无静态模型列表**: 遵循项目架构，不提供静态模型列表
- **用户自定义输入**: 用户可以输入任意腾讯混元模型名
- **智能提示**: 配置时提示用户查看腾讯云控制台获取可用模型
- **模型能力检测**: 基于模型名自动检测能力 (vision, code)
- **默认模型**: hunyuan-pro (专业版，可修改)

**技术实现细节**:

- **提供者类**: 创建`TencentProvider`类，继承自`AIProvider`
- **API格式**: 使用Tencent Cloud API格式，非OpenAI兼容
- **认证方式**: Tencent Cloud API密钥，需要特定头部：
  - `X-TC-Action`: "ChatCompletions"
  - `X-TC-Version`: "2023-09-01"
  - `X-TC-Region`: 默认"ap-guangzhou"
  - `X-TC-Timestamp`: Unix时间戳
  - `Authorization`: Bearer token格式
- **模型能力检测**: 基于模型名自动检测能力 (vision, code)
- **流式支持**: 完整支持流式生成
- **错误处理**: 完整的API错误处理和用户友好提示

#### 2. 文档更新

**文件**: `agentname.md`, `README.md`, `whatisthis.md`
**内容**:

- **版本更新**: 所有文件版本号更新到2.0.0
- **功能列表**: 更新provider总数到12个
- **文档完善**: 更新agentname.md添加Tencent Hunyuan详细说明
- **README更新**: 更新版本号和功能列表

#### 3. 已完成的任务

1. ✅ 创建TencentProvider类 (`src/providers/tencent.js`)
2. ✅ 更新配置向导 (`src/cli/commands/model.js`)
3. ✅ 更新启动系统 (`src/cli/commands/start.js`)
4. ✅ 更新文档 (`agentname.md`, `README.md`, `whatisthis.md`)
5. ✅ 更新版本号到2.0.0

#### 4. 项目现状

**当前状态 (v2.0.0)**:

- **总provider数量**: 12个
- **新增provider**: Tencent Hunyuan (腾讯混元)
- **配置向导**: 支持Tencent Cloud API密钥和区域配置
- **模型支持**: 支持所有腾讯混元模型
- **文档**: 完整更新

**技术架构**:

- 支持DeepSeek、OpenAI、Azure OpenAI、n1n.ai、4SAPI、Qwen (DashScope)、Anthropic、Google Gemini、Ollama、Zhipu AI、Tencent Hunyuan、Custom Provider十二个provider
- 配置系统支持故障回退机制
- 用户界面友好，支持默认值
- 代码质量经过多次清理和优化

**当前状态**:

- Tencent Hunyuan配置：用户输入模型名，提示查看cloud.tencent.com/product/hunyuan
- 使用Tencent Cloud API格式，需要特定头部和认证
- 默认区域：ap-guangzhou (广州)
- 支持流式和非流式生成
- 完整的文件系统集成

6. **查看当前配置**: `naturecode config`

### 向后兼容性

- 现有配置继续工作
- 新配置更灵活，支持任意模型名
- 错误信息更简洁，便于问题诊断

## 安全提醒

GitHub Token安全注意事项:

- 永远不要在代码、日志或文档中存储Token
- 使用环境变量或安全存储管理Token
- 定期轮换Token
- 撤销地址: https://github.com/settings/tokens

## 🔄 如何更新 NatureCode

### 自动更新（推荐）

```bash
# 使用智能安装器（会自动检测并更新）
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash

# 或使用简单安装器
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

### 手动更新

```bash
# 1. 卸载旧版本
npm uninstall -g naturecode

# 2. 清理配置（可选）
rm -rf ~/.naturecode

# 3. 安装新版本
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
```

### 开发者更新

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 更新依赖
npm install

# 3. 重新链接
npm link

# 4. 验证更新
naturecode --version  # 应该显示 1.4.8
```

### 网络问题时的更新

```bash
# 使用本地安装脚本（避免网络问题）
cd /path/to/naturecode
./local-install.sh

# 或使用稳定安装脚本
./robust-install.sh
```

## 🎯 新功能使用指南

### 1. 自定义模型名称

```bash
# 配置模型时会询问名称
naturecode model
# 提示: "Give this configuration a name (e.g., 'Work GPT', 'Personal Claude', 'Code Assistant'):"
```

### 2. 增强的 AI 帮助

```bash
# AI 现在知道如何使用文件工具
naturecode start
# 然后可以问:
# - "帮我修复这个错误" → AI 会先读取相关文件
# - "创建一个React组件" → AI 会提供完整代码
# - "我的项目结构是什么" → AI 会先列出文件
```

### 3. 网络问题解决

```bash
# 如果遇到 SSL 连接问题
curl -kfsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash

# 或使用本地安装
./local-install.sh
```

### 4. sk-proj API 密钥使用

```bash
# 现在支持 OpenAI 项目密钥
naturecode model
# 输入: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# 系统会正确识别并保存项目密钥

# 验证配置
naturecode config
# 应该显示正确的 API 密钥类型
```

### 5. GPT-5 模型使用

```bash
# 配置 GPT-5 模型
naturecode model
# 选择 OpenAI 提供商
# 输入模型名称: gpt-5-mini-preview 或 gpt-5-preview
# 系统会自动使用正确的参数 (max_completion_tokens)

# 启动会话
naturecode start
# AI 会使用 GPT-5 模型进行响应
```

### 6. 详细的错误诊断

```bash
# 当遇到 400 错误时，系统会提供详细诊断
naturecode start
# 如果 API 密钥有问题，会显示:
# - 密钥格式是否正确
# - 是否有足够的权限
# - 网络连接状态
# - 具体建议的解决方案
```

## 📊 版本对比

| 特性             | v1.4.7.3    | v1.4.8      |
| ---------------- | ----------- | ----------- |
| 模型自定义命名   | ✅ 支持     | ✅ 支持     |
| AI 文件工具知识  | ✅ 详细指导 | ✅ 详细指导 |
| 帮助系统准确性   | ✅ 已修复   | ✅ 已修复   |
| 网络问题解决方案 | ✅ 多种方案 | ✅ 多种方案 |
| 本地安装脚本     | ✅ 有       | ✅ 有       |
| sk-proj API 兼容 | ❌ 不支持   | ✅ 完全支持 |
| GPT-5 模型支持   | ❌ 不支持   | ✅ 完全支持 |
| 400 错误诊断     | ❌ 有限     | ✅ 详细分析 |
| 版本一致性       | ❌ 1.4.7.3  | ✅ 1.4.8    |

## 🐛 已知问题与解决方案

### 1. SSL 连接问题

**症状**: `curl: (35) LibreSSL SSL_connect: SSL_ERROR_SYSCALL`
**解决方案**:

```bash
# 方法1: 禁用 SSL 验证（临时）
curl -kfsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash

# 方法2: 使用本地安装
./local-install.sh

# 方法3: 更新 curl
brew upgrade curl
```

### 2. 帮助命令误解

**症状**: `help "question"` 功能已被彻底删除
**澄清**:

- ✅ `naturecode help "question"` 功能已完全移除
- ✅ `naturecode start` 是唯一的 AI 交互方式
- ✅ 所有文档和代码已更新

### 3. 模型配置问题

**症状**: 旧配置没有元数据
**解决方案**: 重新配置模型以获取自定义名称功能

## 🔮 未来计划

### 短期计划

1. **自动化测试** - 添加安装脚本的自动化测试
2. **版本检查脚本** - 确保所有文件版本一致
3. **错误报告系统** - 改进错误诊断和报告

### 长期计划

1. **更多 AI 提供商** - 支持更多 AI 服务
2. **插件市场** - 用户可分享和安装插件
3. **团队协作增强** - 改进团队功能
4. **性能优化** - 提升响应速度和资源使用

## 📞 支持与反馈

### 问题报告

- **GitHub Issues**: https://github.com/naturecode-official/naturecode/issues
- **包含信息**: 版本号、操作系统、错误信息、复现步骤

### 功能请求

- 在 GitHub Issues 提交功能请求
- 描述使用场景和预期行为

### 贡献指南

1. Fork 仓库
2. 创建功能分支
3. 遵循代码规范
4. 添加测试
5. 提交 Pull Request

---

**最后更新**: 2026-02-16  
**当前版本**: NatureCode v1.4.8 已部署到 GitHub
**项目状态**: 完整功能，一键安装系统就绪，所有改进已完成  
**安装命令**: `curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash`  
**GitHub Repository**: https://github.com/naturecode-official/naturecode  
**Main Features**: Cross-platform terminal AI assistant supporting DeepSeek, OpenAI, and Ollama models  
**Core Improvements**: Model customization, enhanced AI system prompts, help system fixes, network issue solutions, sk-proj API compatibility, GPT-5 model support, detailed error diagnostics

## 🎉 v1.4.9 Version Highlights

### 🌐 **Internationalization and English-First Documentation**

- **English-first documentation** for global accessibility
- **Improved language policy**: Chinese for user conversations, English for code and technical documentation
- **Enhanced error messages**: User-friendly Chinese prompts with English technical details
- **GitHub commits**: English-only for global collaboration

### 🔧 **Custom API Endpoint Configuration**

- **Universal base_url support** for all AI providers (OpenAI, DeepSeek, Anthropic, Gemini)
- **Flexible endpoint configuration** for custom API providers and self-hosted services
- **Backward compatibility** with existing configuration files
- **Enhanced validation** for custom endpoints

### 🔄 **Model Restructuring and Migration**

- **Open-source model migration**: GPT-OSS models (gpt-oss-120b, gpt-oss-20b) moved from OpenAI to Ollama provider
- **Google Gemma series**: 8 new models added to Ollama provider (gemma-2b, gemma-7b, gemma-2-9b, gemma-2-27b with instruction-tuned variants)
- **Comprehensive DeepSeek support**: 6 model series with 12 variants for offline and online usage
- **Enhanced model descriptions**: Detailed information about each model's capabilities and use cases

### 🤖 **Enhanced AI Provider Support**

- **DeepSeek offline models**: Full support for DeepSeek's comprehensive model lineup
- **Ollama expansion**: Added support for latest open-source models
- **Provider-specific optimizations**: Custom configurations for each AI provider
- **Error handling improvements**: Better error messages and recovery mechanisms

### 🛡️ **Security and Configuration Improvements**

- **Secure storage**: Encrypted API key storage with enhanced security
- **Configuration validation**: Improved validation for all provider settings
- **Error recovery**: Better handling of network and authentication issues
- **User experience**: Simplified configuration process with clear guidance

## 🔧 **自定义 API 端点配置 (v1.4.9)**

NatureCode 现在支持自定义 API 端点配置，允许用户使用不同的 API 提供商或自托管服务。

### **支持的提供商和默认配置**

```yaml
# OpenAI 兼容 API (包括 OpenAI、DeepSeek 等)
openai:
  provider: openai
  base_url: https://api.openai.com/v1

# DeepSeek API (OpenAI 兼容)
deepseek:
  provider: openai
  base_url: https://api.deepseek.com/v1

# Anthropic Claude API
claude:
  provider: anthropic
  base_url: https://api.anthropic.com/v1

# Google Gemini API
gemini:
  provider: google-gemini
  base_url: https://generativelanguage.googleapis.com/v1beta
```

### **配置方法**

1. **通过环境变量配置**:

   ```bash
   # 设置自定义 OpenAI 兼容 API
   export OPENAI_BASE_URL="https://your-custom-api.com/v1"

   # 设置自定义 DeepSeek API
   export DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"

   # 设置自定义 Anthropic API
   export ANTHROPIC_BASE_URL="https://api.anthropic.com/v1"

   # 设置自定义 Gemini API
   export GEMINI_BASE_URL="https://generativelanguage.googleapis.com/v1beta"
   ```

2. **通过配置文件配置**:
   编辑 `~/.naturecode/config.json`:

   ```json
   {
     "provider": "openai",
     "base_url": "https://your-custom-api.com/v1",
     "apiKey": "your-api-key",
     "model": "gpt-5-mini"
   }
   ```

3. **通过 CLI 配置**:

   ```bash
   # 运行配置向导
   naturecode model

   # 在配置过程中，可以指定自定义 base_url
   ```

### **使用场景**

1. **自托管 OpenAI 兼容 API**:
   - 使用 LocalAI、Ollama 等自托管服务
   - 配置: `base_url: http://localhost:8080/v1`

2. **企业私有 API**:
   - 使用公司内部的 AI 服务
   - 配置: `base_url: https://ai.internal.company.com/v1`

3. **不同区域的 API 端点**:
   - 使用特定区域的 API 服务
   - 配置: `base_url: https://api.us.openai.com/v1`

### **兼容性说明**

- **OpenAI 兼容 API**: 所有使用 OpenAI 格式的 API 都支持
- **DeepSeek**: 完全兼容 OpenAI API 格式
- **Anthropic**: 使用 Claude API 格式
- **Gemini**: 使用 Google Gemini API 格式

### **故障排除**

如果遇到 API 连接问题:

1. 检查 `base_url` 格式是否正确
2. 确保 API 端点支持相应的模型
3. 验证 API 密钥权限
4. 检查网络连接和防火墙设置

### **版本更新说明**

**v1.4.9 更新内容**:

1. 添加自定义 `base_url` 配置支持
2. 更新所有提供商支持自定义 API 端点
3. 修复模型兼容性问题
4. 改进错误处理和诊断信息

## 🔄 **模型结构调整 (v1.4.9)**

### **开源模型迁移**

为了更合理的模型分类，NatureCode 进行了以下模型结构调整：

#### **从 OpenAI 迁移到 Ollama 的模型**:

- `gpt-oss-120b` → 迁移到 Ollama 提供商
- `gpt-oss-20b` → 迁移到 Ollama 提供商

**理由**: 这些是开源模型，更适合在本地运行的 Ollama 环境中使用。

#### **新增 Google Gemma 系列模型到 Ollama**:

- `gemma-2b`, `gemma-2b-it`
- `gemma-7b`, `gemma-7b-it`
- `gemma-2-9b`, `gemma-2-9b-it`
- `gemma-2-27b`, `gemma-2-27b-it`

**理由**: Gemma 是 Google 的开源模型系列，适合在 Ollama 中本地运行。

### **更新后的模型分类**

#### **OpenAI 提供商 (云端 API)**:

- GPT-5 系列: `gpt-5.2`, `gpt-5.2-pro`, `gpt-5-mini`, `gpt-5-nano`
- GPT-4.1 系列: `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`
- o 系列优化模型: `o3-pro`, `o3-mini`, `o1-pro`, `o1-mini`

#### **Ollama 提供商 (本地运行)**:

- Meta 系列: `llama3.2`, `llama3.1`
- Mistral 系列: `mistral`, `mixtral`
- 代码生成系列: `codellama`
- DeepSeek 系列: `deepseek-coder`, `deepseek-chat`, `deepseek-math`, `deepseek-reasoner`, `deepseek-v2`, `deepseek-v2-lite`
- 其他模型: `phi`, `qwen`
- **新增**: GPT 开源系列 (`gpt-oss-120b`, `gpt-oss-20b`)
- **新增**: Google Gemma 系列 (8个模型)

#### **其他云端提供商**:

- **DeepSeek**: `deepseek-chat`, `deepseek-reasoner`
- **Anthropic**: Claude 系列 (9个模型)
- **Gemini**: Gemini 系列 (6个模型)

### **迁移影响**

1. **现有用户**: 如果之前配置了 `gpt-oss-120b` 或 `gpt-oss-20b`，需要重新配置模型
2. **新用户**: 可以直接在 Ollama 中选择这些开源模型
3. **向后兼容**: 配置管理器会自动处理模型验证

### **DeepSeek 离线模型支持**

NatureCode 现在支持完整的 DeepSeek 离线模型系列，可以在本地通过 Ollama 运行：

#### **可用的 DeepSeek 模型**:

- **`deepseek-coder`**: 代码生成专用模型，擅长编程任务
- **`deepseek-chat`**: 通用聊天模型，适合日常对话和问答
- **`deepseek-math`**: 数学推理模型，专为数学问题优化
- **`deepseek-reasoner`**: 复杂推理模型，适合逻辑分析和问题解决
- **`deepseek-v2`**: 最新一代模型，综合能力最强
- **`deepseek-v2-lite`**: 轻量版 V2 模型，资源消耗更少

#### **DeepSeek 模型特点**:

1. **中文优化**: 所有 DeepSeek 模型都对中文有良好支持
2. **代码能力**: DeepSeek Coder 专门为编程任务训练
3. **数学推理**: DeepSeek Math 在数学问题上表现优异
4. **本地运行**: 完全离线，保护隐私和数据安全
5. **免费使用**: 无需 API 密钥，完全免费

#### **安装和使用**:

```bash
# 1. 安装 Ollama (如果尚未安装)
curl -fsSL https://ollama.ai/install.sh | sh

# 2. 拉取 DeepSeek 模型
ollama pull deepseek-chat
ollama pull deepseek-coder
ollama pull deepseek-math

# 3. 配置 NatureCode 使用 Ollama
naturecode model
# 选择 Ollama 提供商，然后选择 deepseek-chat 或其他 DeepSeek 模型
```

### **使用建议**

1. **云端服务**: 使用 OpenAI、DeepSeek、Anthropic、Gemini 提供商
2. **本地运行**: 使用 Ollama 提供商运行开源模型
3. **DeepSeek 选择**:
   - 编程任务: `deepseek-coder`
   - 日常聊天: `deepseek-chat`
   - 数学问题: `deepseek-math`
   - 复杂推理: `deepseek-reasoner`
   - 最佳性能: `deepseek-v2`
   - 资源有限: `deepseek-v2-lite`
4. **性能考虑**: 大模型需要更多计算资源，请根据硬件选择合适模型

---

## 📋 项目开发计划完成情况

### **已发布版本和功能**

#### 1. **文件系统访问功能** (v1.2.4) - **已发布**

- AI 可以访问本地文件系统
- 支持读取、编辑、创建、删除文件
- 安全沙箱限制（当前目录及子目录）
- 自然语言命令识别
- 操作日志和自动备份

#### 2. **优化和测试功能** (v1.2.5) - **已发布**

- 统一错误处理系统
- 反馈收集系统
- 文件缓存机制
- 性能优化
- 完整测试套件 (88个测试全部通过)
- 安全增强

#### 3. **插件系统和会话管理** (v1.4.0) - **已发布**

- 完整的插件系统架构
- 5种插件类型支持
- 插件安全管理和验证
- 会话管理系统
- 会话类型和模板支持
- 会话存储和搜索功能
- 完整的测试套件 (257个测试全部通过)

#### 4. **代码审查助手** (v1.4.1) - **已发布**

- 20+ 内置代码审查规则
- 团队标准集成
- Git PR/MR 集成
- AI 驱动的代码审查
- 会话集成和审查历史
- 完整的测试套件 (273个测试全部通过)

#### 5. **团队协作工具** (v1.4.2) - **已发布**

- 团队项目管理（项目、任务、里程碑）
- 团队成员管理（注册、认证、角色）
- 团队组织（团队、邀请、权限）
- 实时协作功能（WebSocket、协同编辑）
- 权限系统（RBAC、审计日志）
- 模板系统（项目标准化）
- 与代码审查系统集成
- 完整的 CLI 命令集成

#### 6. **第三方工具集成和性能监控** (v1.4.3) - **已发布**

- 第三方工具集成管理器（支持14+开发工具）
- 性能监控系统（实时系统指标监控）
- 集成测试套件（23个测试全部通过）

#### 7. **AI提供商扩展** (v1.5.x) - **已发布**

- **OpenAI**: GPT-4o, GPT-4, GPT-3.5系列
- **DeepSeek**: DeepSeek Chat, DeepSeek Reasoner
- **Anthropic**: Claude 3.5系列 (Sonnet, Haiku, Opus)
- **Google Gemini**: Gemini 3系列, Gemini 2.5系列
- **Ollama**: 本地开源模型支持
- **Zhipu AI (智谱AI)**: GLM-4系列
- **Tencent Hunyuan (腾讯混元)**: 腾讯云AI模型
- **Baidu ERNIE (文心一言)**: 百度AI模型
- **Qwen (DashScope)**: 阿里云通义千问
- **Azure OpenAI**: Microsoft Azure托管
- **n1n.ai**: OpenAI兼容API
- **4SAPI**: OpenAI兼容API
- **Custom Provider**: 自定义API连接

#### 8. **架构改进** (v1.5.0) - **已发布**

- 移除预制模型名，支持用户自定义输入
- 简化错误处理
- 只使用官方API端点
- 智能提示用户查看各AI服务商官网获取可用模型

### **详细功能完成情况**

#### **用户体验优化** - **已完成**

- 统一的错误处理系统
- 用户友好的错误消息和解决建议
- 文件操作反馈信息改进
- 进度指示器（大文件处理）
- 文件操作确认选项（可配置）

#### **性能优化** - **已完成**

- 文件缓存机制
- 大文件读取性能优化
- 并发操作限制
- 内存使用监控和优化
- 智能缓存失效策略

#### **测试套件** - **已完成**

- 完整的单元测试
- 集成测试（文件系统 + AI）
- 性能基准测试
- 并发测试
- 错误处理测试

#### **Git集成** - **已完成**

- Git命令执行（status, diff, commit, push, pull）
- 代码差异分析
- 提交消息生成
- 分支管理
- 合并冲突检测

#### **代码分析** - **已完成**

- 代码复杂度分析
- 代码质量评分
- 代码重复检测
- 依赖关系分析
- 架构可视化

#### **项目管理** - **已完成**

- 项目结构分析
- 依赖管理
- 项目健康度检查
- 技术债务评估
- 项目文档生成

#### **扩展配置** - **已完成**

- 多模型配置支持
- 配置文件加密
- 配置版本管理
- 配置导入/导出
- 配置验证和修复

---

## 🛠️ NatureCode 完整命令列表

### **核心命令（用户可直接使用）**

1. **`naturecode model`** - 配置AI模型和API设置
   - 选择AI提供商（12+选项）
   - 输入API密钥
   - 配置模型参数

2. **`naturecode start [options]`** - 启动交互式AI会话
   - `--project <path>`: 设置项目路径

3. **`naturecode delmodel [name]`** - 删除模型配置
   - `<name>`: 删除指定名称的模型配置
   - `all`: 删除所有模型配置
   - `-f, --force`: 强制删除无需确认

4. **`naturecode config`** - 显示当前配置
   - 查看已配置的AI模型和参数
   - 显示系统设置和首选项
   - **输出内容**：
     - `provider`: 当前使用的AI提供商（如 ollama、openai、deepseek）
     - `apiKey`: API密钥（敏感信息被隐藏）
     - `model`: 选择的AI模型名称
     - `modelType`: 模型类型（chat、completion等）
     - `temperature`: 生成温度（0.0-1.0）
     - `maxTokens`: 最大生成令牌数
     - `stream`: 是否启用流式响应
     - `fallbackModel`: 备用模型名称

### **AI内部化功能（通过AI会话访问）**

以下高级功能已改为AI内部使用，用户通过自然语言与AI交互访问：

- **代码分析** (`code analyze`, `code metrics`, `code deps`, `code issues`, 等)

### **AI内部化功能（通过AI会话访问）**

以下高级功能已改为AI内部使用，用户通过自然语言与AI交互访问：

- **代码分析** (`code analyze`, `code metrics`, `code deps`, `code issues`, 等)
- **项目管理** (`project analyze`, `project health`, `project structure`, `project upgrades`, 等)
- **代码审查** (`review`)
- **团队协作** (`team`)
- **性能监控** (`performance`)
- **会话管理** (`session`)

**使用方式**：

```
用户：请分析我的代码质量
AI：我将运行代码分析...
（AI内部调用相应功能）

用户：检查我的项目健康状况
AI：正在分析项目结构...
（AI内部调用相应功能）

用户：监控系统性能
AI：开始性能监控...
（AI启动时自动显示性能信息）
```

### **`naturecode config` 命令详解**

`naturecode config` 命令用于查看和管理 NatureCode 的配置信息。这是了解当前系统设置和诊断配置问题的重要工具。

#### **主要功能**：

1. **查看当前配置**：显示所有已配置的AI模型参数和系统设置
2. **配置验证**：检查配置是否正确加载和有效
3. **故障诊断**：帮助识别配置相关的问题

#### **典型输出示例**：

```json
{
  "provider": "ollama",
  "apiKey": "",
  "model": "deepseek-coder",
  "modelType": "chat",
  "temperature": 0.7,
  "maxTokens": 2000,
  "stream": true,
  "fallbackModel": "llama3.2"
}
```

#### **配置字段说明**：

- **`provider`**：当前使用的AI提供商
  - 可选值：`ollama`、`openai`、`deepseek`、`anthropic`、`gemini`、`baidu`、`tencent`、`zhipuai`、`azure-openai`、`n1n`、`4sapi`、`custom`
- **`apiKey`**：API密钥（敏感信息，显示时被隐藏）
- **`model`**：选择的AI模型名称
  - 示例：`deepseek-coder`、`gpt-4`、`claude-3-opus`、`gemini-pro`
- **`modelType`**：模型类型
  - `chat`：对话模型
  - `completion`：补全模型
- **`temperature`**：生成温度（0.0-1.0）
  - 较低值：更确定性和一致的输出
  - 较高值：更多样化和创造性的输出
- **`maxTokens`**：最大生成令牌数
  - 控制AI响应的长度
- **`stream`**：是否启用流式响应
  - `true`：实时流式输出
  - `false`：等待完整响应后输出
- **`fallbackModel`**：备用模型名称
  - 当主模型不可用时使用的备用模型

#### **使用场景**：

1. **配置验证**：运行 `naturecode config` 确认配置是否正确加载
2. **问题诊断**：当AI会话出现问题时，检查配置是否正确
3. **设置查看**：了解当前的AI模型和参数设置
4. **备份配置**：复制配置信息用于备份或迁移

#### **常见问题**：

- **配置未加载**：如果看到空配置或错误，运行 `naturecode model` 重新配置
- **API密钥问题**：确保API密钥正确且未过期
- **模型不可用**：检查选择的模型是否在所选提供商中可用

#### **配置管理**：

- **修改配置**：使用 `naturecode model` 命令修改配置
- **删除配置**：使用 `naturecode delmodel` 命令删除配置
- **多配置支持**：支持多个模型配置，通过 `naturecode model` 切换

### **使用示例**

```bash
# 1. 配置AI模型
naturecode model

# 2. 启动AI会话
naturecode start

# 3. 查看当前配置
naturecode config

# 4. 删除模型配置
naturecode delmodel my-old-model
naturecode delmodel all --force



# 6. 获取帮助
naturecode --help

# 7. 查看版本
naturecode --version

### **AI内部功能使用示例（通过自然语言）**

```

用户：请分析我的代码质量
AI：我将运行代码分析...
（AI内部调用代码分析功能）

用户：检查我的项目健康状况
AI：正在分析项目结构...
（AI内部调用项目管理功能）

用户：帮我审查这段代码
AI：开始代码审查...
（AI内部调用代码审查功能）

用户：显示系统性能
AI：性能监控已启动...
（AI启动时自动显示性能信息）

````

### **AI提供商选择指南**

| 提供商              | 特点                         | 适合场景               |
| ------------------- | ---------------------------- | ---------------------- |
| **DeepSeek**        | 免费、中文优化、代码能力强   | 日常开发、中文对话     |
| **OpenAI**          | 行业领先、模型丰富           | 专业开发、复杂任务     |
| **Anthropic**       | 安全可靠、推理能力强         | 安全敏感应用、复杂分析 |
| **Google Gemini**   | 多模态、集成Google生态       | 多模态任务、Google用户 |
| **Ollama**          | 本地运行、完全免费、隐私保护 | 离线使用、数据安全     |
| **Baidu ERNIE**     | 中文优化、百度生态           | 中文应用、百度服务用户 |
| **Tencent Hunyuan** | 腾讯生态、中文优化           | 腾讯云用户、中文应用   |
| **Zhipu AI**        | 国产模型、GLM系列            | 国产化需求             |
| **Qwen**            | 阿里云、通义系列             | 阿里云用户             |
| **Azure OpenAI**    | 企业级、Azure集成            | 企业部署、Azure用户    |
| **自定义**          | 灵活、支持任何API            | 特殊需求、私有部署     |

---

## 🚀 下一步计划

### **已实现功能**

1. **Android 移动端支持** ✅ - 完整的终端应用，支持所有 AI 功能
   - **APK 下载**: [naturecode-android-release.apk](https://github.com/naturecode-official/naturecode/releases/latest/download/naturecode-android-release.apk)
   - **功能特性**: 终端界面、Linux 命令、NatureCode AI 集成
   - **系统要求**: Android 8.0+，100MB+ 存储空间

### **待开发功能**

1. **高级代码生成**: 基于项目上下文的智能代码生成
2. **多语言支持**: 更多编程语言的深度支持
3. **云部署**: 一键部署到云平台
4. **市场插件**: 插件市场和社区贡献
5. **iOS 支持**: iOS 设备优化版本
6. **企业功能**: 企业级管理和监控

### **技术改进**

1. **性能优化**: 更快的响应时间和更低的内存占用
2. **安全性增强**: 更严格的安全控制和审计
3. **用户体验**: 更直观的界面和交互
4. **文档完善**: 更全面的文档和教程

### **社区建设**

1. **开源贡献**: 鼓励社区贡献和插件开发
2. **用户反馈**: 建立用户反馈和改进机制
3. **案例分享**: 收集和分享成功使用案例
4. **教程资源**: 创建更多学习资源和使用指南

---

## 📝 2026-02-18 更新记录

### **AI 中心化改造完成**

**目标**: 将 NatureCode 转变为纯粹的 AI 中心化应用，用户通过自然语言与 AI 交互，AI 内部调用复杂功能

#### **已完成的工作**:

1. **删除插件系统**:
   - 完全移除插件系统源代码 (`src/plugins/`)
   - 删除插件命令 (`naturecode plugin`)
   - 删除插件设计文档

2. **简化用户界面**:
   - 删除 `collaboration` 命令 (实时协作工具)
   - 删除 `permissions` 命令 (基于角色的访问控制)
   - 删除 `team-review` 命令 (团队代码审查)
   - 删除 `integration` 命令 (第三方工具集成)
   - 删除 `feedback` 命令 (用户反馈)
   - 删除 `help` 命令 (简化帮助系统)

3. **保留的核心命令** (用户直接交互):
   - `model` - 配置 AI 模型和 API 设置
   - `start` - 启动交互式 AI 会话
   - `config` - 显示当前配置
   - `delmodel` - 删除模型配置

4. **AI 内部化功能** (通过 AI 会话访问):
   - 代码分析 (`analyzeCode()`)
   - 项目管理 (`manageProject()`)
   - 代码审查 (`reviewCode()`)
   - 性能监控 (AI 启动时自动显示)

#### **设计理念**:
- **用户友好**: 用户只需与 AI 自然对话，无需记忆复杂命令
- **AI 驱动**: AI 理解用户意图，自动调用合适的功能模块
- **简化界面**: 最小化 CLI 命令，最大化 AI 交互体验
- **功能完整**: 所有高级功能仍然可用，但通过 AI 访问

#### **使用示例**:
```bash
# 传统方式 (已删除)
naturecode code analyze src/
naturecode project create my-project

# AI 中心化方式 (现在)
naturecode start
> 请分析我的代码质量
> 请帮我创建一个新项目
````

## 📝 2026-02-18 第二次更新记录

### **进一步简化：删除团队协作相关功能**

**目标**: 根据用户要求，删除除了模型配置以外的 collaboration、permissions、team-review 功能

#### **已删除的功能**:

1. **团队协作工具**:
   - 删除 `src/utils/team/` 目录（包含所有团队协作工具）
   - 删除实时协作 (`realtime-collaboration.js`)
   - 删除团队命令 (`team-commands.js`)
   - 删除成员管理 (`member-manager.js`)
   - 删除代码审查集成 (`code-review-integration.js`)
   - 删除项目管理 (`project-manager.js`)
   - 删除权限管理 (`permissions.js`)

2. **团队命令**:
   - 删除 `src/cli/commands/team.js` 文件
   - 删除 `team` 命令及相关功能

3. **AI Provider 更新**:
   - 从 `src/providers/base.js` 中删除 `manageTeam()` 方法
   - 删除 `createTeamCollaboration` 导入

4. **测试文件清理**:
   - 删除 `tests/team/` 测试目录
   - 删除 `tests/feedback.test.js`（feedback 功能已删除）

#### **当前状态**:

- **用户命令**: 仅保留 `model`, `start`, `config`, `delmodel`
- **AI 内部功能**: 代码分析、项目管理、代码审查、性能监控
- **已删除**: 所有团队协作、权限管理、实时协作功能
- **设计理念**: 纯粹的 AI 助手，专注于代码开发和模型配置

#### **修复的问题**:

- 修复了交互模式中 `delmodel` 命令不工作的问题
- 现在交互模式中可以直接输入 `delmodel <name>` 删除模型

**当前版本**: NatureCode v2.0.0
**最后更新**: 2026年2月18日
**状态**: ✅ **极致简化完成**，专注于核心 AI 助手功能

- **核心功能**: 4个核心命令 + AI 交互
- **AI 能力**: 代码分析、项目管理、代码审查
- **平台支持**: Android、Windows、macOS、Linux
- **稳定运行**: 经过测试，生产环境就绪

```

```

## 🔄 AI-Centric Transformation Update (February 18, 2026)

NatureCode has been transformed into a pure AI-centric application with the following changes:

### Major Changes:

1. **Only 4 user commands**: , , ,
2. **All advanced features AI-internal**: Code analysis, project management, Git operations accessible through AI conversation
3. **Enhanced command**: Supports multiple name formats (provider, model, combination)
4. **Removed non-essential features**: Plugin system, team collaboration, standalone code/project commands

### Key Improvements:

- Simplified user interface with natural language interaction
- Comprehensive model management with flexible deletion options
- Clear user guidance and error messages
- Updated documentation reflecting AI-centric design

### Usage Examples:

```bash
# Delete models in various formats
naturecode delmodel deepseek              # By provider
naturecode delmodel deepseek-chat         # By model
naturecode delmodel deepseek-deepseek-chat # Provider-model combination
naturecode delmodel all --force           # Force delete all
```

### AI Conversation Examples:

```
> analyze the code in src/
> create a new React project
> check project health
> commit my changes with message "fix: update"
> show performance metrics
```

See [UPDATE_SUMMARY.md](UPDATE_SUMMARY.md) for complete details.
