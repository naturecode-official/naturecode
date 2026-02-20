#!/bin/bash

# NatureCode 下载链接更新脚本
# 版本: 1.0.0

set -e

echo "========================================"
echo "NatureCode 下载链接更新工具"
echo "========================================"

# 检查参数
if [ $# -eq 0 ]; then
    echo "用法: $0 <release-tag>"
    echo "示例: $0 v2.0.0"
    exit 1
fi

TAG_NAME="$1"
VERSION="${TAG_NAME#v}"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在 NatureCode 项目根目录运行此脚本"
    exit 1
fi

# 验证标签格式
if [[ ! "$TAG_NAME" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "错误: 标签格式不正确，应为 vX.Y.Z"
    echo "当前: $TAG_NAME"
    exit 1
fi

echo "更新下载链接到版本: $VERSION (标签: $TAG_NAME)"

# 基础 URL
BASE_URL="https://github.com/naturecode-official/naturecode/releases/download/$TAG_NAME"

# 更新 README.md
update_readme() {
    echo "更新 README.md..."
    
    local readme_file="README.md"
    local temp_file="${readme_file}.tmp"
    
    # 备份原文件
    cp "$readme_file" "${readme_file}.backup"
    
    # 更新下载表格部分
    awk -v tag="$TAG_NAME" -v base_url="$BASE_URL" '
    BEGIN { in_table = 0; table_updated = 0 }
    
    # 找到下载表格开始
    /## 📥 Quick Downloads/ {
        in_table = 1
        print $0
        next
    }
    
    # 在表格中替换链接
    in_table && /\[📱 naturecode-android-release\.apk\]/ {
        gsub(/releases\/latest\/download/, "releases/download/" tag)
        table_updated = 1
        print $0
        next
    }
    
    in_table && /\[🪟 naturecode-win\.exe\]/ {
        gsub(/releases\/latest\/download/, "releases/download/" tag)
        print $0
        next
    }
    
    in_table && /\[🍎 naturecode-macos\]/ {
        gsub(/releases\/latest\/download/, "releases/download/" tag)
        print $0
        next
    }
    
    in_table && /\[🐧 naturecode-linux\]/ {
        gsub(/releases\/latest\/download/, "releases/download/" tag)
        print $0
        next
    }
    
    # 表格结束
    in_table && /^## / && !/## 📥 Quick Downloads/ {
        in_table = 0
        print $0
        next
    }
    
    # 更新 Android 部分的直接链接
    /\[naturecode-android-release\.apk\]\(https:\/\/github\.com\/naturecode-official\/naturecode\/releases\/latest\/download\/naturecode-android-release\.apk\)/ {
        gsub(/releases\/latest\/download/, "releases/download/" tag)
        print $0
        next
    }
    
    /\[naturecode-android-debug\.apk\]\(https:\/\/github\.com\/naturecode-official\/naturecode\/releases\/latest\/download\/naturecode-android-debug\.apk\)/ {
        gsub(/releases\/latest\/download/, "releases/download/" tag)
        print $0
        next
    }
    
    # 默认打印其他行
    { print $0 }
    
    END {
        if (table_updated) {
            print "> 注意: 链接已更新到版本 " tag "。最新版本请查看 GitHub Releases。"
        }
    }
    ' "$readme_file" > "$temp_file"
    
    # 替换原文件
    mv "$temp_file" "$readme_file"
    
    echo "README.md 更新完成"
}

# 更新 whatisthis.md
update_whatisthis() {
    echo "更新 whatisthis.md..."
    
    local whatisthis_file="whatisthis.md"
    
    if [ -f "$whatisthis_file" ]; then
        # 备份
        cp "$whatisthis_file" "${whatisthis_file}.backup"
        
        # 更新版本信息
        sed -i '' "s/**当前版本**: NatureCode v[0-9]\.[0-9]\.[0-9]/**当前版本**: NatureCode v$VERSION/" "$whatisthis_file"
        sed -i '' "s/**最后更新**: [0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}/**最后更新**: $(date +%Y-%m-%d)/" "$whatisthis_file"
        
        echo "whatisthis.md 更新完成"
    else
        echo "警告: whatisthis.md 文件不存在"
    fi
}

# 创建版本特定的下载说明
create_version_notes() {
    echo "创建版本下载说明..."
    
    local notes_file="dist/downloads-${TAG_NAME}.md"
    
    cat > "$notes_file" << EOF
# NatureCode $VERSION 下载指南

## 直接下载链接

### Android
- **[稳定版 APK](${BASE_URL}/naturecode-android-release.apk)** - 推荐大多数用户
- **[调试版 APK](${BASE_URL}/naturecode-android-debug.apk)** - 开发者测试用

### Windows
- **[可执行文件](${BASE_URL}/naturecode-win.exe)** - 便携式，无需安装

### macOS
- **[二进制文件](${BASE_URL}/naturecode-macos)** - 赋予执行权限后运行
  \`\`\`bash
  chmod +x naturecode-macos
  ./naturecode-macos --help
  \`\`\`

### Linux
- **[二进制文件](${BASE_URL}/naturecode-linux)** - 赋予执行权限后运行
  \`\`\`bash
  chmod +x naturecode-linux
  ./naturecode-linux --help
  \`\`\`

## 安装说明

### Android
1. 下载 APK 文件到设备
2. 启用"安装未知来源应用"
3. 打开 APK 文件安装
4. 启动"NatureCode Terminal"

### 桌面版
1. 下载对应平台的文件
2. (Linux/macOS) 赋予执行权限: \`chmod +x naturecode-*\`
3. 运行: \`./naturecode-* --help\`

## 验证下载

### 校验和
下载后验证文件完整性:

\`\`\`bash
# MD5 校验
md5sum naturecode-*

# SHA256 校验  
sha256sum naturecode-*
\`\`\`

校验和文件:
- [MD5SUMS](${BASE_URL}/MD5SUMS)
- [SHA256SUMS](${BASE_URL}/SHA256SUMS)

### 安全建议
1. 从官方 GitHub Releases 下载
2. 验证校验和
3. 使用病毒扫描工具检查
4. 在沙盒环境中测试新版本

## 故障排除

### 下载问题
1. **链接失效**: 检查标签名称是否正确
2. **权限错误**: 确保有下载权限
3. **网络问题**: 检查网络连接

### 安装问题
1. **Android 安装失败**: 启用"未知来源"设置
2. **执行权限错误**: 运行 \`chmod +x\` 命令
3. **系统兼容性**: 检查系统要求

## 其他资源

- [完整发布说明](https://github.com/naturecode-official/naturecode/releases/tag/$TAG_NAME)
- [用户文档](https://github.com/naturecode-official/naturecode/blob/main/README.md)
- [问题报告](https://github.com/naturecode-official/naturecode/issues)

## 版本信息
- **版本**: $VERSION
- **标签**: $TAG_NAME
- **更新日期**: $(date +%Y-%m-%d)
- **Git 提交**: $(git rev-parse --short HEAD)

---
*此文件自动生成，链接指向特定版本 $TAG_NAME*
EOF
    
    echo "版本下载说明已创建: $notes_file"
}

# 更新 package.json 版本 (可选)
update_package_version() {
    echo "检查 package.json 版本..."
    
    local current_version=$(grep '"version"' package.json | cut -d'"' -f4)
    
    if [ "$current_version" != "$VERSION" ]; then
        read -p "package.json 版本为 $current_version，更新到 $VERSION? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sed -i '' "s/\"version\": \"$current_version\"/\"version\": \"$VERSION\"/" package.json
            echo "package.json 版本已更新"
        fi
    else
        echo "package.json 版本已是最新"
    fi
}

# 创建简单的测试脚本
create_test_script() {
    echo "创建链接测试脚本..."
    
    cat > "test-download-links.sh" << EOF
#!/bin/bash

# NatureCode 下载链接测试脚本
# 测试版本: $TAG_NAME

set -e

echo "测试 NatureCode $VERSION 下载链接..."
echo "标签: $TAG_NAME"
echo "时间: \$(date)"
echo ""

BASE_URL="https://github.com/naturecode-official/naturecode/releases/download/$TAG_NAME"

test_url() {
    local url="\$1"
    local filename="\$(basename "\$url")"
    
    echo -n "测试 \$filename... "
    
    # 使用 curl 测试链接
    if curl -s -I "\$url" 2>/dev/null | grep -q "200 OK\|302 Found"; then
        echo "✅ 可用"
        return 0
    else
        echo "❌ 不可用"
        return 1
    fi
}

echo "测试直接下载链接:"
echo ""

# 测试主要文件
test_url "\${BASE_URL}/naturecode-android-release.apk"
test_url "\${BASE_URL}/naturecode-win.exe"
test_url "\${BASE_URL}/naturecode-macos"
test_url "\${BASE_URL}/naturecode-linux"

echo ""
echo "测试校验和文件:"
echo ""

test_url "\${BASE_URL}/MD5SUMS"
test_url "\${BASE_URL}/SHA256SUMS"

echo ""
echo "测试完成!"
echo ""
echo "如果所有链接都可用，说明 Release 配置正确。"
echo "如果有链接不可用，请检查:"
echo "1. Release 是否已发布 (不是草稿)"
echo "2. 文件是否已上传到 Release"
echo "3. 标签名称是否正确"
EOF
    
    chmod +x "test-download-links.sh"
    echo "测试脚本已创建: test-download-links.sh"
}

# 显示更新摘要
show_summary() {
    echo ""
    echo "========================================"
    echo "✅ 下载链接更新完成!"
    echo "========================================"
    echo ""
    echo "更新摘要:"
    echo "• 版本: $VERSION"
    echo "• 标签: $TAG_NAME"
    echo ""
    echo "更新的文件:"
    echo "1. README.md - 下载链接表格和直接链接"
    echo "2. whatisthis.md - 版本信息和更新日期"
    echo "3. dist/downloads-${TAG_NAME}.md - 版本特定下载指南"
    echo "4. test-download-links.sh - 链接测试脚本"
    echo ""
    echo "新的下载链接:"
    echo "• Android: ${BASE_URL}/naturecode-android-release.apk"
    echo "• Windows: ${BASE_URL}/naturecode-win.exe"
    echo "• macOS: ${BASE_URL}/naturecode-macos"
    echo "• Linux: ${BASE_URL}/naturecode-linux"
    echo ""
    echo "下一步:"
    echo "1. 测试链接: ./test-download-links.sh"
    echo "2. 提交更改: git add . && git commit -m 'docs: update download links for $TAG_NAME'"
    echo "3. 推送到 GitHub: git push"
    echo ""
    echo "注意: 这些是指向特定版本的链接。"
    echo "要使用最新版本链接，请使用: releases/latest/download/"
    echo "但需要确保最新 Release 存在且包含相应文件。"
    echo "========================================"
}

# 主函数
main() {
    echo "开始更新下载链接..."
    
    # 1. 更新 README.md
    update_readme
    
    # 2. 更新 whatisthis.md
    update_whatisthis
    
    # 3. 创建版本下载说明
    create_version_notes
    
    # 4. 更新 package.json (可选)
    update_package_version
    
    # 5. 创建测试脚本
    create_test_script
    
    # 6. 显示摘要
    show_summary
}

# 运行主函数
main