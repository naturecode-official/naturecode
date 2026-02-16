# NatureCode Windows 安装指南

## 系统要求

- Windows 10 或更高版本
- Node.js 18 或更高版本（可选，如果使用预构建的可执行文件）
- Git Bash、WSL 或 PowerShell（推荐 Git Bash）

## 安装方法

### 方法 1：使用预构建的可执行文件（推荐）

1. 从 [GitHub Releases](https://github.com/naturecode-official/naturecode/releases) 下载最新版本的 `naturecode-win.exe`
2. 将可执行文件放在任意目录（如 `C:\Program Files\NatureCode\`）
3. 将该目录添加到系统 PATH 环境变量
4. 在命令行中运行 `naturecode-win.exe --version` 验证安装

### 方法 2：使用 Node.js 安装

#### 使用 Git Bash（推荐）

1. 安装 [Git for Windows](https://gitforwindows.org/)
2. 打开 Git Bash 终端
3. 运行安装命令：
   ```bash
   curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash
   ```

#### 使用 PowerShell

1. 以管理员身份打开 PowerShell
2. 运行以下命令：

   ```powershell
   # 下载安装脚本
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/naturecode-official/naturecode/main/install-simple.sh" -OutFile "install-naturecode.ps1"

   # 运行安装
   .\install-naturecode.ps1
   ```

### 方法 3：从源代码构建

1. 安装 Node.js 18+ 和 Git
2. 克隆仓库：
   ```bash
   git clone https://github.com/naturecode-official/naturecode.git
   cd naturecode
   ```
3. 安装依赖：
   ```bash
   npm install
   ```
4. 全局安装：
   ```bash
   npm link
   ```
5. 验证安装：
   ```bash
   naturecode --version
   ```

## Windows 特定说明

### 路径说明

- 配置文件位置：`%USERPROFILE%\.naturecode\config.json`
- 插件目录：`%USERPROFILE%\.naturecode\plugins\`
- 会话存储：`%USERPROFILE%\.naturecode\sessions\`

### 环境变量

在 Windows 上，NatureCode 使用以下环境变量：

- `USERPROFILE` - 用户主目录（相当于 Unix 的 `HOME`）
- `APPDATA` - 应用程序数据目录
- `LOCALAPPDATA` - 本地应用程序数据目录

### 命令行使用

#### PowerShell

```powershell
naturecode start
naturecode model
naturecode --help
```

#### CMD

```cmd
naturecode start
naturecode model
naturecode --help
```

#### Git Bash

```bash
naturecode start
naturecode model
naturecode --help
```

## 故障排除

### 常见问题

1. **"命令未找到" 错误**
   - 确保 NatureCode 目录已添加到 PATH
   - 重启终端窗口

2. **SSL 连接错误**

   ```bash
   # 临时解决方案
   git config http.sslVerify false
   # 安装完成后恢复
   git config http.sslVerify true
   ```

3. **权限问题**
   - 以管理员身份运行终端
   - 检查文件权限

4. **Node.js 版本问题**
   ```bash
   node --version  # 确保版本 >= 18
   ```

### 网络问题

如果遇到网络连接问题，可以尝试：

1. 使用代理：

   ```bash
   set HTTP_PROXY=http://proxy.example.com:8080
   set HTTPS_PROXY=http://proxy.example.com:8080
   ```

2. 使用本地安装脚本：
   ```bash
   ./install-local.sh
   ```

## 开发说明

### 构建 Windows 可执行文件

```bash
# 安装构建工具
npm install

# 构建所有平台（包括 Windows）
npm run build

# 或使用 Makefile
make build
```

构建的输出文件：

- `dist/naturecode-win.exe` - Windows 可执行文件
- `dist/naturecode-linux` - Linux 可执行文件
- `dist/naturecode-macos` - macOS 可执行文件

### Windows 开发环境设置

1. 安装 Visual Studio Code
2. 安装 Node.js 扩展
3. 安装 Git for Windows
4. 配置终端为 Git Bash

## 支持

如果遇到问题，请：

1. 检查 [GitHub Issues](https://github.com/naturecode-official/naturecode/issues)
2. 查看详细错误信息
3. 提供操作系统版本和 Node.js 版本

## 更新

### 更新 NatureCode

```bash
# 方法 1：重新运行安装脚本
curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash

# 方法 2：从源代码更新
cd naturecode
git pull origin main
npm install
npm link
```

### 卸载

```bash
# 卸载全局安装
npm uninstall -g naturecode

# 删除配置文件（可选）
rm -rf ~/.naturecode
# Windows: rmdir /s %USERPROFILE%\.naturecode
```

---

**注意**：NatureCode 在 Windows 上使用 `\` 作为路径分隔符，但在代码中统一使用 `path.join()` 处理，确保跨平台兼容性。
