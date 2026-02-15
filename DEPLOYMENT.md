# NatureCode Deployment Guide

## Overview

This document describes how to build, package, and release the NatureCode terminal AI assistant.

## Directory Structure

```
naturecode/
├── src/                    # Source code
├── build/                  # Build output (temporary)
├── dist/                   # Distribution files
├── releases/               # Release packages
├── dmg/                    # macOS DMG files
├── package.json           # Project configuration
├── Makefile               # Build tools
├── packager.js            # Packaging tool
├── install.sh             # Installation script
├── build_dmg.sh           # DMG build script
├── DEPLOYMENT.md          # This document
├── CHANGELOG.md           # Changelog
└── VERSION                # Version file
```

## 构建工具

### 1. Makefile（推荐）
```bash
# 安装依赖
make install

# 构建应用程序
make build

# 运行测试
make test

# 代码检查
make lint

# 清理构建文件
make clean

# 创建发布包
make package

# 创建 macOS DMG
make dmg

# 完整发布流程
make release

# 系统安装
make install-system

# 卸载
make uninstall
```

### 2. 包装工具 (packager.js)
```bash
# 更新版本
node packager.js version [major|minor|patch]

# 构建应用程序
node packager.js build

# 清理构建目录
node packager.js clean

# 创建发布包
node packager.js package

# 创建 macOS DMG
node packager.js dmg

# 完整发布流程
node packager.js release [patch|minor|major]
```

### 3. 安装脚本
```bash
# 显示帮助
./install.sh --help

# 安装 NatureCode
sudo ./install.sh

# 卸载 NatureCode
sudo ./install.sh --uninstall
```

## 发布流程

### 步骤 1: 准备发布
```bash
# 确保所有更改已提交
git status

# 更新版本（自动更新 package.json 和 VERSION 文件）
make version-patch    # 或 version-minor, version-major
# 或
node packager.js version patch
```

### 步骤 2: 构建和测试
```bash
# 完整构建流程
make all

# 或分步执行
make clean
make install
make build
make test
make lint
```

### 步骤 3: 创建发布包
```bash
# 创建所有平台的发布包
make package

# 生成的文件在 releases/ 目录
# - naturecode-1.0.0.tar.gz (Linux/macOS)
# - naturecode-1.0.0.zip (Windows)
```

### 步骤 4: 创建 macOS DMG（仅 macOS）
```bash
# 创建 DMG 安装包
make dmg

# 生成的文件在 dmg/ 目录
# - NatureCode-1.0.0-macos.dmg
```

### 步骤 5: 创建版本标签
```bash
# 自动创建 Git 标签
node packager.js release patch

# 或手动创建
git tag -a v1.0.0 -m "Release version 1.0.0"
git push --tags
```

### 步骤 6: 更新变更日志
```bash
# 自动更新 CHANGELOG.md
node packager.js release patch --changes "新增功能1" "修复问题2"

# 或手动编辑 CHANGELOG.md
```

## DMG 安装包说明

### DMG 内容
```
NatureCode.dmg
├── NatureCode.app          # macOS 应用程序
└── install.command         # 安装脚本
```

### 安装方法
1. **拖拽安装**：将 `NatureCode.app` 拖拽到 `Applications` 文件夹
2. **脚本安装**：双击 `install.command` 运行安装脚本
3. **终端安装**：
   ```bash
   # 挂载 DMG
   hdiutil attach NatureCode-1.0.0-macos.dmg
   
   # 复制应用程序
   sudo cp -R /Volumes/NatureCode/NatureCode.app /Applications/
   
   # 卸载 DMG
   hdiutil detach /Volumes/NatureCode/
   ```

### 应用程序结构
```
NatureCode.app/
├── Contents/
│   ├── Info.plist          # 应用程序信息
│   ├── MacOS/              # 可执行文件
│   └── Resources/          # 资源文件
│       ├── bin/            # 命令行工具
│       ├── lib/            # 库文件
│       ├── src/            # 源代码
│       └── node_modules/   # 依赖
```

## 系统安装

### 全局安装（推荐）
```bash
# 使用安装脚本
sudo ./install.sh

# 安装位置
# - 可执行文件: /usr/local/bin/naturecode
# - 程序文件: /usr/local/lib/naturecode
# - 配置文件: ~/.naturecode/
```

### 验证安装
```bash
# 检查版本
naturecode --version

# 测试命令
naturecode --help
naturecode config
```

## 多平台支持

### macOS
- DMG 安装包
- 系统级安装
- 应用程序包

### Linux
- tar.gz 压缩包
- 系统包管理（待实现）
- 手动安装

### Windows
- ZIP 压缩包
- 安装程序（待实现）
- 手动安装

## 版本管理

### 版本号规则
- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 版本文件
- `package.json`：npm 版本
- `VERSION`：纯文本版本
- `CHANGELOG.md`：变更记录

## 故障排除

### 常见问题

1. **权限问题**
   ```bash
   # 修复权限
   chmod +x install.sh build_dmg.sh
   sudo chown -R $(whoami) /usr/local/lib/naturecode
   ```

2. **Node.js 版本问题**
   ```bash
   # 检查 Node.js 版本
   node --version
   
   # 需要 Node.js 16.0.0 或更高版本
   ```

3. **依赖安装失败**
   ```bash
   # 清理 npm 缓存
   npm cache clean --force
   
   # 重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **DMG 创建失败**
   ```bash
   # 安装必要工具
   brew install create-dmg
   
   # 或使用备选方案
   hdiutil create -volname "NatureCode" -srcfolder build/ -ov -format UDZO NatureCode.dmg
   ```

### 调试模式
```bash
# 详细输出
DEBUG=* make build

# 检查文件
ls -la build/ dist/ releases/ dmg/

# 检查日志
tail -f /var/log/system.log
```

## 自动化部署

### GitHub Actions（示例）
```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Create release
        run: |
          if [ "$RUNNER_OS" == "macOS" ]; then
            make dmg
          else
            make package
          fi
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v2
        with:
          name: naturecode-${{ runner.os }}
          path: |
            releases/
            dmg/
```

## 维护说明

### 更新依赖
```bash
# 更新所有依赖
npm update

# 更新特定依赖
npm update package-name

# 检查安全漏洞
npm audit
npm audit fix
```

### 清理项目
```bash
# 清理所有构建文件
make clean
rm -rf node_modules package-lock.json

# 重新开始
npm install
make build
```

### 备份配置
```bash
# 备份用户配置
cp -r ~/.naturecode ~/.naturecode.backup

# 恢复配置
cp -r ~/.naturecode.backup ~/.naturecode
```

## 联系方式

如有问题，请参考：
- [GitHub Issues](https://github.com/yourusername/naturecode/issues)
- 文档：README.md, AGENTS.md
- 变更日志：CHANGELOG.md