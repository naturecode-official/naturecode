# NatureCode Final Installation Commands

## 🎯 推荐安装命令 (主推)

### 1. **智能安装器** (推荐大多数用户)

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
```

**特点**:

- 下载后会询问安装模式
- 用户可选择简单或专业模式
- 统一的安装体验
- 完整的错误处理

## 📦 所有可用安装命令

### 主安装系统

| 命令                                    | 描述                          | 推荐度     |
| --------------------------------------- | ----------------------------- | ---------- |
| `curl .../install.sh \| bash`           | **智能安装器** - 询问模式选择 | ⭐⭐⭐⭐⭐ |
| `curl .../install-simple.sh \| bash`    | 直接简单安装                  | ⭐⭐⭐⭐   |
| `curl .../install-universal.sh \| bash` | 通用安装器                    | ⭐⭐⭐     |

### 备用安装方法

| 方法         | 命令                                                              | 适用场景 |
| ------------ | ----------------------------------------------------------------- | -------- |
| **Git克隆**  | `git clone https://github.com/naturecode-official/naturecode.git` | 开发者   |
| **npm安装**  | `npm install -g naturecode`                                       | 发布后   |
| **本地安装** | `./install-local.sh`                                              | 本地测试 |

##  安装模式说明

### 模式选择界面

```
Select installation mode:

  1) Simple Mode (Recommended for most users)
     • Quick and quiet installation
     • Minimal output
     • Automatic decisions

  2) Professional Mode (For developers/advanced users)
     • Detailed installation process
     • System information
     • Interactive prompts
     • Better error diagnostics

Enter choice [1-2] (default: 1):
```

### 简单模式 (Simple Mode)

- **目标用户**: 普通用户
- **特点**: 快速、安静、自动
- **输出**: 最小化
- **交互**: 无
- **推荐**: 给大多数用户

### 专业模式 (Professional Mode)

- **目标用户**: 开发者/高级用户
- **特点**: 详细、交互式、透明
- **输出**: 详细
- **交互**: 有
- **推荐**: 需要控制或诊断时

##  快速开始

### 安装后第一步

```bash
# 验证安装
naturecode --version
# 应该显示: 1.4.5.4

# 配置AI模型
naturecode model

# 启动交互会话
naturecode start

# 获取AI帮助
naturecode help
```

### 常用命令

```bash
naturecode help                    # 直接AI聊天
naturecode help "your question"    # 特定问题帮助
naturecode git status              # Git状态
naturecode code analyze src/       # 代码分析
naturecode project analyze .       # 项目分析
```

## 📊 命令对比表

| 特性           | `install.sh` | `install-simple.sh` | `install-universal.sh` |
| -------------- | ------------ | ------------------- | ---------------------- |
| **模式选择**   |  询问用户  |  直接简单模式     |  直接专业模式        |
| **用户交互**   |  有        |  无               |  有                  |
| **输出详细**   | 根据模式     | 简单                | 详细                   |
| **GitHub用户** | 固定         | 固定                | 可指定                 |
| **推荐度**     | ⭐⭐⭐⭐⭐   | ⭐⭐⭐⭐            | ⭐⭐⭐                 |

## 🎨 用户体验示例

### 使用 `install.sh` 的体验

```bash
$ curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash

# 输出:
Downloading NatureCode Smart Installer...
Starting NatureCode installation...

╔══════════════════════════════════════════════════════════════════╗
║                   NatureCode Smart Installer                     ║
╚══════════════════════════════════════════════════════════════════╝

Select installation mode:
  1) Simple Mode (Recommended for most users)
  2) Professional Mode (For developers/advanced users)

Enter choice [1-2] (default: 1): 1

Selected: Simple Mode
[INFO] Checking requirements...
[SUCCESS] Requirements OK
[INFO] Installing...
[SUCCESS] Successfully installed NatureCode v1.4.5.4

Quick start:
  naturecode model     # Configure AI model
  naturecode start     # Start interactive session
  naturecode help      # Get AI assistance
```

## 🔄 更新和卸载

### 更新现有安装

```bash
# 所有安装脚本都会自动检测并更新
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
```

### 卸载

```bash
npm uninstall -g naturecode

# 清理配置
rm -rf ~/.naturecode
```

## 🐛 故障排除

### 常见问题

1. **"Command not found"**

   ```bash
   # 重启终端或重新加载配置
   source ~/.bashrc  # 或 ~/.zshrc
   ```

2. **权限错误**

   ```bash
   # 修复npm权限
   npm config set prefix ~/.npm-global
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **安装失败**
   ```bash
   # 清理缓存重试
   npm cache clean --force
   curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
   ```

### 验证安装

```bash
# 检查版本
naturecode --version
# 应该显示: 1.4.5.4

# 测试功能
naturecode help
naturecode model --help
```

## 📁 文件说明

### 必需文件 (上传到GitHub)

- `install.sh` - 主入口点
- `install-smart.sh` - 智能安装器

### 文档文件

- `README_INSTALL.md` - 用户指南
- `FINAL_INSTALL_COMMANDS.md` - 本文档
- `INSTALLATION_ARCHITECTURE.md` - 架构说明

### 备用脚本

- `install-simple.sh` - 直接简单安装
- `install-universal.sh` - 通用安装器
- `install-curl.sh` - 高级安装器

## 🎯 最终建议

### 对于普通用户

```bash
# 使用智能安装器，选择简单模式
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
# 当询问时选择 "1" 或直接按回车
```

### 对于开发者

```bash
# 使用智能安装器，选择专业模式
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
# 当询问时选择 "2"
```

### 对于快速测试

```bash
# 直接简单安装（不询问）
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh | bash
```

##  链接

- **GitHub仓库**: https://github.com/naturecode-official/naturecode
- **问题反馈**: https://github.com/naturecode-official/naturecode/issues
- **完整文档**: 查看 `docs.md`

##  一键安装 (复制这个!)

```bash
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
```

安装后运行 `naturecode help` 开始您的AI编程之旅！
