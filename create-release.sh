#!/bin/bash

# NatureCode GitHub Release 创建脚本
# 版本: 1.0.0

set -e

echo "========================================"
echo "NatureCode GitHub Release 创建工具"
echo "版本: 2.0.1"
echo "========================================"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在 NatureCode 项目根目录运行此脚本"
    exit 1
fi

# 检查必要的工具
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "错误: 未找到 $1，请先安装 $1"
        exit 1
    fi
}

echo "检查工具..."
check_tool "git"
check_tool "gh"

# 检查 GitHub CLI 登录状态
if ! gh auth status &> /dev/null; then
    echo "GitHub CLI 未登录，请先登录:"
    echo "gh auth login"
    exit 1
fi

# 获取版本信息
VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
TAG_NAME="v$VERSION"
RELEASE_NAME="NatureCode $VERSION"
RELEASE_NOTES_FILE="RELEASE_NOTES.md"

# 检查是否已存在该标签
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo "警告: 标签 $TAG_NAME 已存在"
    read -p "是否删除并重新创建? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -d "$TAG_NAME"
        git push origin --delete "$TAG_NAME" 2>/dev/null || true
    else
        echo "取消操作"
        exit 1
    fi
fi

# 创建发布说明
create_release_notes() {
    echo "创建发布说明..."
    
    cat > "$RELEASE_NOTES_FILE" << EOF
# NatureCode $VERSION 发布说明

## 🎉 新功能

### Android 支持
- **首次发布 Android 应用**
- 完整的终端界面，支持 Linux 命令操作
- NatureCode AI 助手集成
- 文件系统访问和网络连接支持

### 核心改进
- **AI 中心化架构**: 简化 CLI，复杂功能通过 AI 访问
- **性能监控**: 自动显示性能信息
- **代码分析增强**: 更全面的代码质量评估
- **项目管理优化**: 更好的项目健康分析

## 📱 平台支持

### Android
- **APK 文件**: naturecode-android-release.apk
- **系统要求**: Android 8.0+ (API 26+)
- **安装**: 启用"未知来源"后直接安装

### Windows
- **可执行文件**: naturecode-win.exe
- **系统要求**: Windows 10/11
- **安装**: 便携式，无需安装

### macOS
- **二进制文件**: naturecode-macos
- **系统要求**: macOS 10.15+
- **安装**: 赋予执行权限后直接运行

### Linux
- **二进制文件**: naturecode-linux
- **系统要求**: 主流 Linux 发行版
- **安装**: 赋予执行权限后直接运行

## 🚀 快速开始

### Android 用户
1. 下载 naturecode-android-release.apk
2. 在设置中启用"安装未知来源应用"
3. 打开 APK 文件安装
4. 启动应用，输入 \`naturecode start\`

### 桌面用户
\`\`\`bash
# 下载对应平台的可执行文件
# 赋予执行权限 (Linux/macOS)
chmod +x naturecode-*

# 运行
./naturecode-* --help
\`\`\`

## 🔧 主要变更

### 已移除的功能 (AI 内部化)
- \`naturecode session\` - 会话管理
- \`naturecode review\` - 代码审查 (通过 AI 访问)
- \`naturecode team\` - 团队协作 (通过 AI 访问)
- \`naturecode performance\` - 性能监控 (自动显示)

### 新增功能
- **Android 应用**: 完整的移动端支持
- **AI 内部功能**: 复杂功能通过 AI 自然语言访问
- **性能监控**: 启动时自动显示
- **文档更新**: 更清晰的用户指南

## 🐛 修复的问题

1. **CLI 简化**: 移除冗余命令，简化用户界面
2. **错误处理**: 改进的错误消息和恢复机制
3. **兼容性**: 更好的跨平台支持
4. **安全性**: 改进的 API 密钥存储

## 📊 技术详情

### 版本信息
- **版本号**: $VERSION
- **构建日期**: $(date +%Y-%m-%d)
- **Git 提交**: $(git rev-parse --short HEAD)
- **Node.js**: $(node --version)

### 文件哈希
\`\`\`
MD5 校验和:
$(find dist -name "*.apk" -o -name "naturecode-*" ! -name "*.zip" | xargs -I {} md5 {} 2>/dev/null || echo "请先构建文件")

SHA256 校验和:
$(find dist -name "*.apk" -o -name "naturecode-*" ! -name "*.zip" | xargs -I {} shasum -a 256 {} 2>/dev/null || echo "请先构建文件")
\`\`\`

## 📁 文件列表

### Android
- \`naturecode-android-release.apk\` - 稳定发布版
- \`naturecode-android-debug.apk\` - 调试版本

### Windows
- \`naturecode-win.exe\` - Windows 可执行文件

### macOS
- \`naturecode-macos\` - macOS 二进制文件

### Linux
- \`naturecode-linux\` - Linux 二进制文件

### 源代码
- \`source-code.zip\` - 完整源代码

## 🔒 安全说明

### 验证下载
1. **校验和验证**: 使用提供的 MD5/SHA256 校验和验证文件完整性
2. **病毒扫描**: 建议使用 VirusTotal 扫描下载的文件
3. **来源验证**: 只从官方 GitHub Releases 下载

### 权限要求
- **Android**: 需要网络和存储权限
- **桌面版**: 需要文件系统访问权限
- **所有平台**: AI 功能需要网络连接

## 🤝 支持

### 文档
- [README.md](https://github.com/naturecode-official/naturecode/blob/main/README.md) - 完整使用指南
- [Android 安装指南](https://github.com/naturecode-official/naturecode/blob/main/dist/android/README-ANDROID.md)
- [iOS 开发指南](https://github.com/naturecode-official/naturecode/blob/main/IOS_DEVELOPMENT_GUIDE.md)

### 问题报告
- [GitHub Issues](https://github.com/naturecode-official/naturecode/issues)
- 邮件: contact@naturecode.ai

### 社区
- GitHub Discussions: 即将推出
- Twitter: @naturecode_ai

## 🙏 致谢

感谢所有贡献者和用户的支持！

---

**注意**: 这是 NatureCode 的首个多平台发布版本。如果您遇到任何问题，请通过 GitHub Issues 报告。

**下一步**: iOS 版本正在开发中，预计下个版本发布。
EOF
    
    echo "发布说明已创建: $RELEASE_NOTES_FILE"
}

# 构建文件 (如果不存在)
build_files_if_needed() {
    echo "检查构建文件..."
    
    local needs_build=false
    
    # 检查 Android APK 文件
    if [ ! -f "dist/android/naturecode-android-release.apk" ]; then
        echo "Android APK 文件不存在，需要构建"
        needs_build=true
    fi
    
    # 检查桌面版可执行文件
    if [ ! -f "dist/naturecode-win.exe" ] || \
       [ ! -f "dist/naturecode-macos" ] || \
       [ ! -f "dist/naturecode-linux" ]; then
        echo "桌面版可执行文件不存在，需要构建"
        needs_build=true
    fi
    
    if [ "$needs_build" = true ]; then
        read -p "是否现在构建文件? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "开始构建..."
            
            # 构建桌面版
            echo "构建桌面版可执行文件..."
            npm run build 2>/dev/null || {
                echo "构建失败，请手动运行: npm run build"
                exit 1
            }
            
            # 构建 Android (需要手动)
            echo "Android 构建需要手动完成，请参考:"
            echo "1. 运行: ./build-android.sh"
            echo "2. 或手动构建 APK"
            echo "继续创建 Release 但不包含 Android 文件"
        else
            echo "继续创建 Release 但不包含构建文件"
        fi
    else
        echo "所有构建文件已存在"
    fi
}

# 收集发布文件
collect_release_files() {
    echo "收集发布文件..."
    
    local release_dir="release-$VERSION"
    mkdir -p "$release_dir"
    
    # 复制 Android 文件
    if [ -d "dist/android" ]; then
        cp dist/android/*.apk "$release_dir/" 2>/dev/null || true
    fi
    
    # 复制桌面版文件
    cp dist/naturecode-* "$release_dir/" 2>/dev/null || true
    
    # 创建源代码包
    echo "创建源代码包..."
    git archive --format=zip --output="$release_dir/source-code.zip" HEAD
    
    # 创建校验和文件
    echo "创建校验和文件..."
    cd "$release_dir"
    md5sum * > MD5SUMS 2>/dev/null || true
    sha256sum * > SHA256SUMS 2>/dev/null || true
    cd ..
    
    # 创建压缩包
    echo "创建发布压缩包..."
    zip -r "naturecode-$VERSION.zip" "$release_dir"
    
    echo "发布文件已准备在: $release_dir/"
    echo "压缩包: naturecode-$VERSION.zip"
}

# 创建 Git 标签
create_git_tag() {
    echo "创建 Git 标签: $TAG_NAME"
    
    # 提交所有更改
    if ! git diff-index --quiet HEAD --; then
        echo "检测到未提交的更改"
        git add .
        git commit -m "chore: prepare release $VERSION"
    fi
    
    # 创建标签
    git tag -a "$TAG_NAME" -m "Release $VERSION"
    git push origin "$TAG_NAME"
    
    echo "标签已创建并推送到远程"
}

# 创建 GitHub Release
create_github_release() {
    echo "创建 GitHub Release..."
    
    # 检查 release 是否已存在
    if gh release view "$TAG_NAME" &>/dev/null; then
        echo "Release $TAG_NAME 已存在"
        read -p "是否删除并重新创建? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            gh release delete "$TAG_NAME" --yes
        else
            echo "取消操作"
            exit 1
        fi
    fi
    
    # 创建 release
    echo "创建 Release: $RELEASE_NAME"
    gh release create "$TAG_NAME" \
        --title "$RELEASE_NAME" \
        --notes-file "$RELEASE_NOTES_FILE" \
        --draft
    
    # 上传文件
    if [ -d "release-$VERSION" ]; then
        echo "上传发布文件..."
        
        # 上传单个文件
        for file in "release-$VERSION"/*; do
            if [ -f "$file" ] && [ "$file" != "release-$VERSION/MD5SUMS" ] && [ "$file" != "release-$VERSION/SHA256SUMS" ]; then
                echo "上传: $(basename "$file")"
                gh release upload "$TAG_NAME" "$file" --clobber
            fi
        done
        
        # 上传校验和文件
        if [ -f "release-$VERSION/MD5SUMS" ]; then
            gh release upload "$TAG_NAME" "release-$VERSION/MD5SUMS" --clobber
        fi
        if [ -f "release-$VERSION/SHA256SUMS" ]; then
            gh release upload "$TAG_NAME" "release-$VERSION/SHA256SUMS" --clobber
        fi
    fi
    
    # 发布 release
    read -p "是否立即发布? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gh release edit "$TAG_NAME" --draft=false
        echo "Release 已发布!"
    else
        echo "Release 已创建为草稿"
        echo "稍后发布: gh release edit $TAG_NAME --draft=false"
    fi
}

# 清理临时文件
cleanup() {
    echo "清理临时文件..."
    rm -f "$RELEASE_NOTES_FILE"
    # 保留 release 目录供参考
    # rm -rf "release-$VERSION"
    # rm -f "naturecode-$VERSION.zip"
}

# 显示成功信息
show_success() {
    echo ""
    echo "========================================"
    echo "✅ Release 创建成功!"
    echo "========================================"
    echo ""
    echo "Release 信息:"
    echo "• 版本: $VERSION"
    echo "• 标签: $TAG_NAME"
    echo "• Release 页面: https://github.com/naturecode-official/naturecode/releases/tag/$TAG_NAME"
    echo ""
    echo "下载链接:"
    echo "• Android APK: https://github.com/naturecode-official/naturecode/releases/download/$TAG_NAME/naturecode-android-release.apk"
    echo "• Windows EXE: https://github.com/naturecode-official/naturecode/releases/download/$TAG_NAME/naturecode-win.exe"
    echo "• macOS: https://github.com/naturecode-official/naturecode/releases/download/$TAG_NAME/naturecode-macos"
    echo "• Linux: https://github.com/naturecode-official/naturecode/releases/download/$TAG_NAME/naturecode-linux"
    echo ""
    echo "下一步:"
    echo "1. 更新 README.md 中的下载链接"
    echo "2. 测试下载链接是否工作"
    echo "3. 通知用户新版本可用"
    echo ""
    echo "要更新 README 链接，运行:"
    echo "./update-download-links.sh $TAG_NAME"
    echo "========================================"
}

# 主函数
main() {
    echo "开始创建 Release $VERSION..."
    
    # 1. 创建发布说明
    create_release_notes
    
    # 2. 检查并构建文件
    build_files_if_needed
    
    # 3. 收集发布文件
    collect_release_files
    
    # 4. 创建 Git 标签
    create_git_tag
    
    # 5. 创建 GitHub Release
    create_github_release
    
    # 6. 清理
    cleanup
    
    # 7. 显示成功信息
    show_success
}

# 运行主函数
main